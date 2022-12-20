export class Balance{
    name: string;
    amount : string;
    brokerage : string;
    balance : string;
    constructor(name: string, amount : string,brokerage : string,balance : string)
    {
        this.name = name;
        this.amount = amount;
        this.brokerage = brokerage;
        this.balance = balance;      
   }
}
