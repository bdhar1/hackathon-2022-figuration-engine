import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Ledger } from 'src/models/ledger';
import { DashboardService } from 'src/services/dashboard.service';
import { LedgerService } from 'src/services/ledger.service';
import { DashboardComponent } from '../dashboard/dashboard.component';

@Component({
  selector: 'app-ledger',
  templateUrl: './ledger.component.html',
  styleUrls: ['./ledger.component.css']
})
export class LedgerComponent implements OnInit {
  refreshSubs: Subscription = new Subscription;
  ledgerList: Ledger[] = []; 
  selectedUserName : string="";
  users : string[]=[];
  isDataExist : boolean = false;
  constructor(private _ledgerService : LedgerService) { }

  ngOnInit(): void {
    this.isDataExist = false;
    this.refreshSubs = this._ledgerService.invokeRefreshMethod.subscribe(res => {
      this.getCustomerLedgerDetails();
    });  
    this.getClientcodes();
  }
  getCustomerLedgerDetails(){
    this._ledgerService.getCustomerDetails(this.selectedUserName).subscribe((result: any) =>{    
      this.ledgerList = result;
   
      for (var i = 0; i < this.ledgerList.length; i++) {
          this.ledgerList[i].amount=  ((this.ledgerList[i].amount.toString()).replace("$",""));
          this.ledgerList[i].price=  ((this.ledgerList[i].price.toString()).replace("$","")).replace(/\,/g,'');;
          this.ledgerList[i].brokerage=  ((this.ledgerList[i].brokerage.toString()).replace("$",""));
          this.ledgerList[i].TransactionAmt=  (parseFloat(this.ledgerList[i].price) * (this.ledgerList[i].quantity)).toLocaleString();
        
      }
      this.isDataExist=true;
    })
  }
  getClientcodes(){
    this._ledgerService.getClientcodes().subscribe(data =>{
      this.users = data;
      this.users .splice(0, 0, "Select");
    })
  }
  refreshData(){
    this.getCustomerLedgerDetails();
  }
  onChange(selectedVal : any) {
    this.selectedUserName = selectedVal.target.value;
    if(this.selectedUserName != "Select")
    {
      this.isDataExist = true;
      this.getCustomerLedgerDetails();
    }
    else
    {
      this.isDataExist = false;
    }
   
  }

}
