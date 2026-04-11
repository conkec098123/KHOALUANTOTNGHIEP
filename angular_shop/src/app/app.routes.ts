import { Routes } from '@angular/router';
import { Login } from './template/login/login';
import { Home } from './template/home/home';
import { Admin } from './template/admin/admin';
import { AddProduct } from './template/add-product/add-product';
import { EditProduct } from './template/edit-product/edit-product';
import { Cart } from './template/cart/cart';

export const routes: Routes = [
    {
        path:'',
        component:Home,
        pathMatch:'full'
    },
    {
        path:"login",
        component: Login
    },
    {
        path:"admin",
        component:Admin
    },
    {
        path:"add-product",
        component:AddProduct
    },
    {
        path:"edit-product/:id",
        component:EditProduct
    },
    {
        path:"cart",
        component:Cart
    },
];
