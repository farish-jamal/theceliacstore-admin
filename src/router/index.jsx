import React from 'react'
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/auth/ProtectedRoute";
import PublicRoute from "@/auth/PublicRoute";
import Login from '@/pages/login';
import Layout from '@/layout';
import Dashboard from '@/pages/dashboard';
import Brand from '@/pages/brands';
import AddBrandCard from '@/pages/brands/components/AddBrandCard';
import ErrorPage from '@/components/404';
import Products from '@/pages/products';
import Categories from '@/pages/categories';
import ProductDetails from '@/pages/products/components/product_details';
import BrandDetails from '@/pages/brands/components/brand_details';
import Admin from '@/pages/admin';
import AddAdminCard from '@/pages/admin/components/AddAdminCard';
import Blogs from '@/pages/blogs';
import SubCategories from '@/pages/sub_categories';
import AddSubCategoryCard from '@/pages/sub_categories/components/AddSubCategoryCard';
import CategoryDetails from '@/pages/categories/components/category_details';
import ProductsEditor from '@/pages/products/components/product_editor';
import CategoryEditor from '@/pages/categories/components/category_editor';

const Router = () => {
  return (
    <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>
      <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<Layout />}>
      <Route index element={<Dashboard />} />
      {/* ProductsRoute */}
      <Route path="/dashboard/products" element={<Products />} />
      <Route path="/dashboard/product/add" element={<ProductsEditor />} />
      <Route path="/dashboard/product/edit/:id" element={<ProductsEditor />} />
      <Route path="/dashboard/products/:id" element={<ProductDetails />} />



    
      {/* Brands Route */}
      <Route path="/dashboard/brands" element={<Brand />} />
      <Route path="/dashboard/brands/add" element={<AddBrandCard />} />
      <Route path="/dashboard/brands/:id" element={<BrandDetails />} />


      {/* Categories Route */}
      <Route path="/dashboard/categories" element={<Categories />} />
    <Route path="/dashboard/category/:id" element={<CategoryDetails />} />
      <Route path="/dashboard/category/add" element={<CategoryEditor />} />
      <Route path="/dashboard/category/edit/:id" element={<CategoryEditor />} />


      {/* Sub Category Route */}
      <Route path="/dashboard/subcategory" element={<SubCategories />} />
      <Route path="/dashboard/subcategory/add" element={< AddSubCategoryCard/>} />

      {/* Admin Routes */}
      <Route path="/dashboard/admins" element={<Admin />} />
      <Route path="/dashboard/admins/add" element={<AddAdminCard />} />
{/* Blogs */}
<Route path="/dashboard/blogs" element={< Blogs/>} />

    </Route>
    </Route>
    <Route path="*" element={<ErrorPage />} />
  </Routes> 
   )
}

export default Router