import { Component, OnInit } from '@angular/core';

interface Medicine {
  medicineId: number;
  englishMedicineName: string;
  arabicMedicineName: string;
  drug: number;
  price: number;
  medicineUrl: string;
  finalprice: number;
  quantity: number;
  discount: number;
}

@Component({
  selector: 'app-warehouses',
  imports: [],
  templateUrl: './warehouses.html',
  styleUrl: './warehouses.css'
})
export class Warehouses implements OnInit {
  medicines: Medicine[] = [];
  loading: boolean = false;
  error: string | null = null;

  ngOnInit() {
    this.fetchMedicines();
  }

  fetchMedicines() {
    this.loading = true;
    fetch('http://www.PharmaAtOncePreDeploy.somee.com/api/Warehouse/GetWarehousMedicines')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then((data: Medicine[]) => {
        this.medicines = data;
        this.loading = false;
      })
      .catch(error => {
        this.error = error.message;
        this.loading = false;
      });
  }
}
