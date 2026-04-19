import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../core/services/order.service';
import { OrderHistory } from '../../../core/models/order.model';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-order-history',
  standalone: true,
 imports: [CommonModule, RouterModule],
  templateUrl: './order-history.html',
  styleUrl: './order-history.css',
})
export class OrderHistoryComponent implements OnInit{
  orders: OrderHistory[] = [];
loading: boolean = true;
  constructor(private orderService: OrderService) { }

  ngOnInit(): void {
    this.loading = true; // نأكد إن التحميل بدأ
    this.orderService.getUserOrders().subscribe({
      next: (res) => {
        this.orders = res;
        this.loading = false; // 2. لما البيانات توصل، وقفي التحميل
      },
      error: (err) => {
        console.log(err);
        this.loading = false; // 3. حتى لو حصل خطأ، وقفي التحميل عشان ميفضلش يلف للأبد
      }
    });
  }
}
