import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DashboardService } from 'src/services/dashboard.service';
import { LedgerService } from 'src/services/ledger.service';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { LedgerComponent } from '../ledger/ledger.component';

@Component({
  selector: 'app-nav-menu',
  templateUrl: './nav-menu.component.html',
  styleUrls: ['./nav-menu.component.css']
})
export class NavMenuComponent implements OnInit {
  isCollapsed: boolean;

  constructor(private router: Router ,private dashboardService : DashboardService,private _ledgerService : LedgerService) {
    this.isCollapsed = true;
  }

  ngOnInit() {
  }
  refreshContent(event : any){
      if(this.router.url == "/dashboard"){
        this.router.navigate(['/dashboard'])
        this.dashboardService.callRefreshMethod("refresh");
      }
      else
      {this.router.navigate(['/ledger'])
      this._ledgerService.callRefreshMethod("refresh");
      }
  }

  collapseNavMenu() {
    if (!this.isCollapsed) {
      this.isCollapsed = !this.isCollapsed;
    }
  }
}
