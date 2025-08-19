import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private ordersUpdatedSource = new Subject<number>();
  ordersUpdated$ = this.ordersUpdatedSource.asObservable();

  notifyOrderUpdated(orderId: number) {
    this.ordersUpdatedSource.next(orderId);
  }
}
