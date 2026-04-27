import { Routes } from '@angular/router';
import { Login } from './template/login/login';
import { Home } from './template/home/home';
import { Admin } from './template/admin/admin';
import { AddProduct } from './template/add-product/add-product';
import { EditProduct } from './template/edit-product/edit-product';
import { Cart } from './template/cart/cart';
import { Productdetail } from './template/productdetail/productdetail';
import { Register } from './template/register/register';

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
        path:"register",
        component:Register
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
    {
        path:"product/:id",
        component:Productdetail
    },
];
