docker build -t stapi:latest .
docker run -d -p 30000:30000 \
           --env PGSSLMODE=require \
           --env PGUSER=trader \
           --env PGHOST=postgrestrading.postgres.database.azure.com \
           --env PGPORT=5432 \
           --env PGDATABASE=postgres \
           --env PGPASSWORD=trade@123 \
           stapi:latest 
docker stop 5bba03c23ff5
az acr login --name acrec6pop7qr5572 --resource-group Team1Hackathon
docker tag stapi:latest acrec6pop7qr5572.azurecr.io/stapi:0.1
docker push acrec6pop7qr5572.azurecr.io/stapi:0.1

az servicebus topic list --resource-group "Team1Hackathon" --namespace-name "devanshu"
az servicebus topic subscription list --resource-group "Team1Hackathon" --namespace-name "devanshu" --topic-name "subtopic"

export PGSSLMODE=require
export PGUSER=trader
export PGHOST=postgrestrading.postgres.database.azure.com
export PGPORT=5432
export PGDATABASE=postgres
export PGPASSWORD=trade@123

export SERVICEBUS_CONNECTION_STRING="Endpoint=sb://devanshu.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=lwuu6ma6lLYsT76L5xQ95U2AFQzjcBo2i1ooVucfyhw="
export TOPIC_NAME="subtopic"
export QUEUE_NAME="subname"

docker build -t processor:latest .
docker run -d -p 30000:30000 \
           --env PGSSLMODE=require \
           --env PGUSER=trader \
           --env PGHOST=postgrestrading.postgres.database.azure.com \
           --env PGPORT=5432 \
           --env PGDATABASE=postgres \
           --env PGPASSWORD=trade@123 \
           --env SERVICEBUS_CONNECTION_STRING="Endpoint=sb://devanshu.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=lwuu6ma6lLYsT76L5xQ95U2AFQzjcBo2i1ooVucfyhw=" \
           --env TOPIC_NAME=subtopic \
           --env QUEUE_NAME=subname \
           processor:latest 
