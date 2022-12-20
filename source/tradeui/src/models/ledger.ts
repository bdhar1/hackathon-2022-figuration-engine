export class Ledger {
    ClientName: string;
    date: Date;
    time: Date;
    scrip: string;
    operation: string;
    price: string;
    quantity: number;
    amount: string;
    TransactionAmt: string;
    brokerage: string;

    constructor(
        ClientName: string, date: Date,
        time: Date,
        scrip: string,
        operation: string,
        price: string,
        quantity: number,
        amount: string,
        TransactionAmt: string,
        brokerage: string) {
        this.ClientName = ClientName;
        this.date = date;
        this.time = time;
        this.scrip = scrip;
        this.operation = operation;
        this.price = price;
        this.quantity = quantity;
        this.amount = amount;
        this.TransactionAmt = TransactionAmt;
        this.brokerage = brokerage;
    }
}
