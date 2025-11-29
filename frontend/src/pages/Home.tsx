import { useEffect, useState } from "react";
import type { Category } from "../types";
import { fetchCategories } from "../api/productAPI";
import { Col, Row, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import CategoryCard from "../components/CategoryCard";

export default function Home() {
    const [category, setCategory] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetchCategories()
            .then(setCategory)
            .catch(err => console.error("Failed to fetch categories:", err))
            .finally(() => setLoading(false));
    }, []);


    if (loading) return (
        <Spin style={{ alignSelf: 'center' }} indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
    )

    if (!category.length) return (
        <p style={{ textAlign: 'center', marginTop: 60 }}>Không có danh mục nào.</p>
    )

    return (
        <Row gutter={[16, 16]} style={{ padding: 16 }}>
            {category.map((cat) => (
                <Col xs={24} sm={12} md={8} key={cat.id}>
                    <CategoryCard category={cat} />
                </Col>
            ))}
        </Row>
    )
}
