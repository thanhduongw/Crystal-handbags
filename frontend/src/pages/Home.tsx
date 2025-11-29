import { useEffect, useState } from "react";
import type { Product, Category } from "../types";
import { fetchCategories, fetchProducts } from "../api/productAPI";
import { Carousel, Col, Row, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import CategoryCard from "../components/CategoryCard";
import ProductCard from "../components/ProductCard";

export default function Home() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchProducts(), fetchCategories()])
            .then(([prods, cats]) => {
                setProducts(prods.filter(p => p.showHomepage));
                setCategories(cats);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <Spin
            style={{ display: 'block', margin: '100px auto' }}
            indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
        />
    );

    return (
        <>
            <Carousel arrows draggable autoplay autoplaySpeed={4000}>
                {["slide1", "slide2", "slide3"].map((slide, idx) => (
                    <div key={slide}>
                        <img
                            src="https://placehold.co/600x400"
                            alt={`Slide ${idx + 1}`}
                            style={{ width: "100%", height: 700, objectFit: "cover" }}
                        />
                    </div>
                ))}
            </Carousel>

            {/* DANH MỤC */}
            <Row justify="center" style={{ paddingTop: 16 }}>
                <h1>Danh mục sản phẩm</h1>
            </Row>
            <Row gutter={[16, 16]} style={{ padding: 16 }}>
                {categories.length
                    ? categories.map(cat => (
                        <Col xs={24} sm={12} md={8} key={cat.id}>
                            <CategoryCard category={cat} />
                        </Col>
                    ))
                    : <p style={{ textAlign: 'center', width: '100%' }}>Không có danh mục nào.</p>
                }
            </Row>

            {/* SẢN PHẨM MỚI */}
            <Row justify="center" style={{ paddingTop: 16 }}>
                <h1>Sản phẩm mới</h1>
            </Row>
            <Row gutter={[16, 16]} style={{ padding: 16 }}>
                {products.length
                    ? products.map(product => (
                        <Col xs={24} sm={12} md={8} lg={6} key={product.productId}>
                            <ProductCard product={product} />
                        </Col>
                    ))
                    : <p style={{ textAlign: 'center', width: '100%' }}>Không có sản phẩm mới.</p>
                }
            </Row>
        </>
    );
}
