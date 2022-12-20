export class Status{
    NoofTransactions: string;
    Avgprocessingtime : number;
    constructor(NoofTransactions: string, Avgprocessingtime : number)   {
        this.NoofTransactions = NoofTransactions;
        this.Avgprocessingtime = Avgprocessingtime;
   }
}
