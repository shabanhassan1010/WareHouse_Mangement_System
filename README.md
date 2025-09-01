# 📦 Pharmacy System  

This project is a **Pharmacy Management Web Application** built with **Angular 20** and **ASP.NET Core (Clean Architecture)**.
It allows warehouses, pharmacies, and admins to manage medicines, orders, and system activities.  

## 🚀 Features  

### 🔹 Warehouse  
- ✅ Upload Excel sheets to add or update medicines, with error handling for invalid or missing data.
- ✅ Update order status (e.g., pending → shipped → delivered).  
- ✅ View and manage all orders.  
- ✅ Update profile status.  
- 🔒 Medicine Management:  
  - If the warehouse is **trusted**, it can **add, edit, and delete medicines**.  
  - If the warehouse is **not trusted**, it **cannot edit or delete medicines**.  

### 🔹 Pharmacy  
- 🛒 Place new orders to warehouses.  
- 📦 Track order status in real time.  

### 🔹 Admin  
- 👤 Manage users (warehouses & pharmacies).  
- 🔑 Approve or revoke trusted status for warehouses.  

---

## 🛠 Development  

Run the Angular development server:

```bash
ng serve
