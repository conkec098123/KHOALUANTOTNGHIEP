import { Routes } from '@angular/router';
import { Login } from './template/login/login';
import { Home } from './template/home/home';
import { Admin } from './template/admin/admin';
import { AddProduct } from './template/add-product/add-product';
import { EditProduct } from './template/edit-product/edit-product';
import { Cart } from './template/cart/cart';
import { Productdetail } from './template/productdetail/productdetail';
import { Register } from './template/register/register';
import { ChangePassword } from './template/change-password/change-password';
import { PaymentSuccess } from './template/payment-success/payment-success';
import { ForgetPassword } from './template/forget-password/forget-password';
import { ResetPassword } from './template/reset-password/reset-password';
import { Profile } from './template/profile/profile';
import { Address } from './template/address/address';
import { OrderManagement } from './template/order-management/order-management';
import { OrderDetail } from './template/order-detail/order-detail';
import { Review } from './template/review/review';
import { MainHome } from './template/main-home/main-home';

export const routes: Routes = [
    {
        path:'',
        component:MainHome,
        pathMatch:'full'
    },
    {
        path:"home",
        component: Home
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
    {
        path:"change-password",
        component:ChangePassword
    },
    {
        path:"payment-success",
        component:PaymentSuccess
    },
    {
        path:"forget-password",
        component:ForgetPassword
    },
    {
        path:"reset-password",
        component:ResetPassword
    },
    {
        path:"profile",
        component:Profile
    },
    {
        path:"address",
        component:Address
    },
    {
        path:"order-management",
        component:OrderManagement
    },
    {
        path:"order-detail/:id",
        component:OrderDetail
    },
    {
        path:"review/:id",
        component:Review
    },
];
