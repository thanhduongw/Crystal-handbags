import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import type { Product } from "../types";
import { fetchProductsByCat } from "../api/productAPI";
import { Col, Row, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import ProductCard from "../components/ProductCard";

export default function ProductList() {
    const { id } = useParams<{ id: string }>();
    const categoryId = Number(id);
    const [data, setData] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    if (!id || isNaN(categoryId)) return <Navigate to={"/"} replace />

    useEffect(() => {
        fetchProductsByCat(categoryId)
            .then(setData)
            .finally(() => setLoading(false))
    }, [data])

    if (loading) return (
        <Spin style={{ alignSelf: 'center' }} indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
    )

    return (
        <>
            <Row gutter={[16, 16]} style={{ padding: 16 }}>
                {data.map((product) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={product.productId}>
                        <ProductCard product={product} />
                    </Col>
                ))}
            </Row>
        </>
    );
}
