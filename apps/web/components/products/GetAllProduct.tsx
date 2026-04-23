import { setAllProducts } from "@/hook/slices/commerce/products/ProductSlice";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

const GetAllProduct = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [globalHeaderActive, setGlobalHeaderActive] = useState(false);
  const [activeHeader, setActiveHeader] = useState<any | null>(null);
  const [globalFooterActive, setGlobalFooterActive] = useState(false);
  const [activeFooter, setActiveFooter] = useState<any | null>(null);
  const dispatch= useDispatch()
  const fetchGlobalHeaderStatus = async () => {
    try {
      const res = await fetch("/api/site-header");
      if (res.ok) {
        const data = await res.json();
        const active = Array.isArray(data)
          ? data.find((h: any) => h.isActive)
          : null;
        setGlobalHeaderActive(!!active);
        setActiveHeader(active || null);
      }
    } catch (err) {
      console.error("Failed to fetch global header status", err);
    }
  };

  const fetchGlobalFooterStatus = async () => {
    try {
      const res = await fetch("/api/site-footer");
      if (res.ok) {
        const data = await res.json();
        const active = Array.isArray(data)
          ? data.find((f: any) => f.isActive)
          : null;
        setGlobalFooterActive(!!active);
        setActiveFooter(active || null);
      }
    } catch (err) {
      console.error("Failed to fetch global footer status", err);
    }
  };

  useEffect(() => {
    const handleRefresh = () => {
      fetchGlobalHeaderStatus();
    };
    window.addEventListener("kalp:refresh-headers", handleRefresh);

    const handleRefreshFooters = () => {
      fetchGlobalFooterStatus();
    };
    window.addEventListener("kalp:refresh-footers", handleRefreshFooters);

    const fetchCommerceData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch("/api/ecommerce/products?limit=50", { cache: "no-store" }),
          fetch("/api/ecommerce/categories?limit=50", { cache: "no-store" }),
        ]);
        const prodData = await prodRes.json().catch(() => ({}));
        const catData = await catRes.json().catch(() => ({}));
        console.log("prodData", prodData);
        console.log("catData", catData);
        dispatch(setAllProducts(prodData));
        if (Array.isArray(prodData?.data)) setProducts(prodData.data);
        else if (Array.isArray(prodData)) setProducts(prodData);

        if (Array.isArray(catData?.data)) setCategories(catData.data);
        else if (Array.isArray(catData)) setCategories(catData);
      } catch {
        // ignore
      }
    };
    void fetchCommerceData();

    return () => {
      window.removeEventListener("kalp:refresh-headers", handleRefresh);
      window.removeEventListener("kalp:refresh-footers", handleRefreshFooters);
    };
  }, []);

  return (
  null
  );
};

export default GetAllProduct;