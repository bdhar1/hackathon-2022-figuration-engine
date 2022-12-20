#!/bin/bash

echo "############################################################"
echo "## Trade Brokerage calculator script ##"
echo "############################################################"
echo

subscriptionId=`az account list --query '[0].id' --output tsv`
locationName=centralindia
rgName=rg-brokerage-calculator
servicebus=sb-brokerage-calculator
pginstance=postgrestrading
acrName=acrbrokeragecalculator
aciName=acistatapi
aciName_processor=processor
aciName_ui=tradeui


echo "Select subscription:"
az account list --output table
read -p "Subscription Id [$subscriptionId]: "
if [[ -n "${REPLY}" ]]
then
  subscriptionId=$REPLY
fi


read -p "ACI Name for processor [$aciName_processor]: " 
if [[ -n "${REPLY}" ]]
then
  aciName_processor=$REPLY
fi

read -p "Location [$locationName]: " 
if [[ -n "${REPLY}" ]]
then
  locationName=$REPLY
fi


read -p "Name of the Resource Group [$rgName]: " 
if [[ -n "${REPLY}" ]]
then
  rgName=$REPLY
fi

read -p "Name of the Service Bus [$servicebus]: " 
if [[ -n "${REPLY}" ]]
then
  servicebus=$REPLY
fi

read -p "Name of the Containter Registry [$acrName]: " 
if [[ -n "${REPLY}" ]]
then
  acrName=$REPLY
fi

read -p "Name of the Postgres Instance [$pginstance]: " 
if [[ -n "${REPLY}" ]]
then
  pginstance=$REPLY
fi

read -p "Name of the Azure Container Instance for UI [$aciName_ui]: " 
if [[ -n "${REPLY}" ]]
then
  aciName_ui=$REPLY
fi

read -p "Name of the Azure Container Instance for API [$aciName]: " 
if [[ -n "${REPLY}" ]]
then
  aciName=$REPLY
fi


# Check and create whether group exists or not.
if az group exists --name $rgName --subscription $subscriptionId | grep -q 'true'; 
then
  echo "Group exists... using the resource group."
else
  echo "Group does not exist. Creating..."
  az group create --location $locationName --name $rgName --subscription $subscriptionId 
  if [ $? -ne 0 ] 
  then
    echo "Group creation failed. Exiting."
    exit 1
  fi
fi


# Check and create Service Bus namespace
if az servicebus namespace exists --name $servicebus --subscription $subscriptionId --query "nameAvailable" --output tsv | grep -q 'false';
then
  echo "Service Bus namespace exists... using the namespace."
else
  echo "Creating Service Bus namespace..."
  az servicebus namespace create --name $servicebus --subscription $subscriptionId --resource-group $rgName --location $locationName
  az servicebus topic create --resource-group  $rgName   --namespace-name $servicebus --name tradebrokeragetopic
  az servicebus topic subscription create --resource-group $rgName  --namespace-name $servicebus --topic-name tradebrokeragetopic --name tradebrokeragesub
  if [ $? -ne 0 ] 
  then
    echo "Servie Bus namespace creation failed. Exiting."
    exit 1
  fi
fi


# Check and create Postgres Instance
if az Postgres Instance exists --name $pginstance --subscription $subscriptionId --query "nameAvailable" --output tsv | grep -q 'false';
then
  echo "Postgres DB Instance create"
else
  echo "Creating Postgres DB Instance"
 az postgres flexible-server create --name $pginstance --resource-group $rgName --admin-user trader --admin-password trade@123 --location $locationName --sku-name Standard_B2s --tier Burstable --version 13 --storage-size 32 --zone 1 --public-access 0.0.0.0-255.255.255.255
  if [ $? -ne 0 ] 
  then
    echo "Postgres DB Instance creation failed. Exiting."
    exit 1
  fi
fi

# Creating User , Schema , Tables and giving Permissions in Postgres Instance

 psql "host=$pginstance.postgres.database.azure.com port=5432 dbname=postgres user=trader password=trade@123 sslmode=require" -c "CREATE SCHEMA trading ;
create table trading.transaction (transaction_id uuid,transaction_date date,transaction_time time,client_code varchar(10),scrip_code varchar(10),type char(1),quantity integer,price money,brokerage money,amount money); 
create table trading.transaction_summary (client_code varchar(10),amount money,brokerage money,balance money,trans_count integer);
create table trading.stats (parameter varchar(100),value float8);
grant all on trading.transaction to trader;
grant all on trading.transaction_summary to trader;
grant all on trading.stats to trader;"

# add extestion to the database

 echo "Postgres DB Instance Extension creation."

az postgres flexible-server parameter set --resource-group  $rgName --server-name $pginstance --subscription $subscriptionId --name  azure.extensions --value "uuid-ossp"
psql "host=$pginstance.postgres.database.azure.com port=5432 dbname=postgres user=trader password=trade@123 sslmode=require" -c "CREATE extension \"uuid-ossp\";"

# Check and create ACR
 temp=`az acr list --resource-group $rgName --subscription $subscriptionId --query "[?contains(name, '$acrName')].name" --output tsv`
if [[ -n "${temp}" ]]
then
  echo "Azure Container Registry exists. Skipping creation."
else
  echo "Creating Azure Container Registry..."
  az acr create --name $acrName --resource-group $rgName --subscription $subscriptionId --sku Basic --admin-enabled true --location $locationName --public-network-enabled true
  if [ $? -ne 0 ] 
  then
    echo "Azure Container Registry creation failed. Exiting."
    exit 1
  fi
fi

acrUserName=`az acr credential show --name $acrName --subscription $subscriptionId --query "username" --output tsv`
echo -e "username is $acrUserName"
acrUserPass=`az acr credential show --name $acrName --subscription $subscriptionId --query "passwords[0].value" --output tsv`
echo -e "password is $acrUserPass"

# Building container image for API
versionTag="v0"
temp=`az acr repository list --name $acrName  --output tsv`
if [[ -n "${temp}" ]]
then
  temp=`az acr repository show-tags --name $acrName  --orderby time_desc --query "[0]" --output tsv`
  if [[ -n "${temp}" ]]
  then
    versionTag=$(echo $temp | sed "s/\([^0-9]*\)\([0-9]*\)/\1/")$(($(echo $temp | sed "s/\([^0-9]*\)\([0-9]*\)/\2/") + 1))
  fi
fi

echo "Building container image :$versionTag..."
az acr build --registry $acrName --image $acrName.azurecr.io/$aciName:$versionTag  --file ./statapi/Dockerfile ./statapi 
if [ $? -ne 0 ] 
then
  echo "Image build failed. Exiting."
  exit 1
fi

# Build ACI Instance for API
temp=`az container list --resource-group $rgName --subscription $subscriptionId --query "[?contains(name, '$aciName_ui')].name" --output tsv`
if [[ -n "${temp}" ]]
then
  echo "Azure Container Instance exists. Deleting..."
  az container delete --name $aciName --resource-group $rgName --subscription $subscriptionId --yes
fi

echo "Getting Service Bus Credentials"
ServiceBusCredentials=`az servicebus namespace authorization-rule keys list -g $rgName --namespace-name  $servicebus -n "RootManageSharedAccessKey" --query "primaryConnectionString" -o tsv`

echo "Creating Azure Container Instance..."
az container create --resource-group $rgName \
                    --subscription $subscriptionId \
                    --name $aciName \
                    --location $locationName \
                    --image "$acrName.azurecr.io/$aciName:$versionTag" \
                    --cpu 1 \
                    --memory 1 \
                    --registry-password "$acrUserPass" \
                    --registry-username "$acrUserName" \
                    --dns-name-label $aciName  --ports 30000 \
                    --environment-variables  PGSSLMODE="require" \
                                             PGUSER="trader" \
                                             PGHOST=$pginstance.postgres.database.azure.com \
                                             PGPORT="5432" \
                                             PGDATABASE="postgres" \
                                             PGPASSWORD="trade@123" \

#changing the API endpoint URL in UI solution
var1=`az container show --name $aciName --resource-group $rgName --query "{FQDN:ipAddress.fqdn}" --out table`
var2=$(echo $var1| awk -F" " '{print $3}')
# sed -i "s/$aciName.$locationName.azurecontainer.io/$var2/g" ./tradeui/src/assets/prodconfig.json
echo "{\"apiendpointurl\":\"http://${var2}:30000/api/\"}" > ./tradeui/src/assets/prodconfig.json

# Building container image for UI
versionTag="v0"
temp=`az acr repository list --name $acrName  --output tsv`
if [[ -n "${temp}" ]]
then
  temp=`az acr repository show-tags --name $acrName  --orderby time_desc --query "[0]" --output tsv`
  if [[ -n "${temp}" ]]
  then
    versionTag=$(echo $temp | sed "s/\([^0-9]*\)\([0-9]*\)/\1/")$(($(echo $temp | sed "s/\([^0-9]*\)\([0-9]*\)/\2/") + 1))
  fi
fi

echo "Building container image :$versionTag..."
az acr build --registry $acrName --image $acrName.azurecr.io/$aciName_ui:$versionTag  --file ./tradeui/Dockerfile ./tradeui 
if [ $? -ne 0 ] 
then
  echo "Image build failed. Exiting."
  exit 1
fi

# Build ACI Instance for UI
temp=`az container list --resource-group $rgName --subscription $subscriptionId --query "[?contains(name, '$aciName_ui')].name" --output tsv`
if [[ -n "${temp}" ]]
then
  echo "Azure Container Instance exists. Deleting..."
  az container delete --name $aciName_ui --resource-group $rgName --subscription $subscriptionId --yes
fi

echo "Creating Azure Container Instance..."
az container create --resource-group $rgName \
                    --subscription $subscriptionId \
                    --name $aciName_ui \
                    --location $locationName \
                    --image "$acrName.azurecr.io/$aciName_ui:$versionTag" \
                    --cpu 1 \
                    --memory 1 \
                    --registry-password "$acrUserPass" \
                    --registry-username "$acrUserName" \
                    --dns-name-label $aciName_ui  --ports 80


# Building container image for API Processor
versionTag="v0"
temp=`az acr repository list --name $acrName  --output tsv`
if [[ -n "${temp}" ]]
then
  temp=`az acr repository show-tags --name $acrName --repository $aciName_processor --orderby time_desc --query "[0]" --output tsv`
  if [[ -n "${temp}" ]]
  then
    versionTag=$(echo $temp | sed "s/\([^0-9]*\)\([0-9]*\)/\1/")$(($(echo $temp | sed "s/\([^0-9]*\)\([0-9]*\)/\2/") + 1))
  fi
fi

echo "Building container image :$versionTag..."
az acr build --registry $acrName --image $acrName.azurecr.io/$aciName_processor:$versionTag  --file ./processor/Dockerfile ./processor 
if [ $? -ne 0 ] 
then
  echo "Image build failed. Exiting."
  exit 1
fi

# Build ACI Instance for API Processor
temp=`az container list --resource-group $rgName --subscription $subscriptionId --query "[?contains(name, '$aciName_processor')].name" --output tsv`
if [[ -n "${temp}" ]]
then
  echo "Azure Container Instance exists. Deleting..."
  az container delete --name $aciName_processor --resource-group $rgName --subscription $subscriptionId --yes
fi

echo "Creating Azure Container Instance..."
az container create --resource-group $rgName \
                    --subscription $subscriptionId \
                    --name $aciName_processor \
                    --location $locationName \
                    --image "$acrName.azurecr.io/$aciName_processor:$versionTag" \
                    --cpu 1 \
                    --memory 1 \
                    --registry-password "$acrUserPass" \
                    --registry-username "$acrUserName" \
                    --dns-name-label $aciName_processor --ports 80 \
                    --environment-variables PGSSLMODE="require" \
                                             PGUSER="trader" \
                                             PGHOST=$pginstance.postgres.database.azure.com \
                                             PGPORT="5432" \
                                             PGDATABASE="postgres" \
                                             PGPASSWORD="trade@123" \
                                             SERVICEBUS_CONNECTION_STRING="$ServiceBusCredentials" \
                                             TOPIC_NAME=tradebrokeragetopic \
                                             QUEUE_NAME=tradebrokeragesub


