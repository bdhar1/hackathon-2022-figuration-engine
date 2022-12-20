import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Balance } from 'src/models/balance';
import { Status } from 'src/models/status';
import { DashboardService } from 'src/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  refreshSubs: Subscription = new Subscription;
  statusList: Status[] = []; 
  tempstatusList: any = []; 
  parameterList : any;
  //resultList: any; 
  balanceList: Balance[] = []; 
  resultList = {
    NoofTransactions: "",
    Avgprocessingtime: ""
};
  constructor(private _dashboardService:DashboardService) { }

  ngOnInit() {
    this.refreshSubs = this._dashboardService.invokeRefreshMethod.subscribe(res => {
      this.getStatusData();
      this.getBalanceData();
    });
    this.getStatusData();
    this.getBalanceData();
  }
  getStatusData(){
    this._dashboardService.getStatus().subscribe(result =>{
      this.parameterList = result;
    })
  }
  getBalanceData(){
    this._dashboardService.getBalance().subscribe(data =>{
      this.balanceList = data
      for (var i = 0; i < this.balanceList.length; i++) {
        this.balanceList[i].amount=  ((this.balanceList[i].amount.toString()).replace("$",""));
        this.balanceList[i].balance=  ((this.balanceList[i].balance.toString()).replace("$",""));
        this.balanceList[i].brokerage=  ((this.balanceList[i].brokerage.toString()).replace("$",""));
      
    }
    })
  }


}
