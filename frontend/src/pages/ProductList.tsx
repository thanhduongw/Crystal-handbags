import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Col, Row, Spin, Pagination } from 'antd';
import type { Product } from '../types';
import { fetchProductsByCat } from '../api/productAPI';
import ProductCard from '../components/ProductCard';

export default function ProductList() {
    const { id } = useParams<{ id: string }>();
    const categoryId = Number(id);
    const [data, setData] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 12;

    if (!id || isNaN(categoryId)) return <Navigate to="/" replace />;

    useEffect(() => {
        loadProducts();
    }, [categoryId, currentPage]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const products = await fetchProductsByCat(categoryId);
            setData(products);
            setTotal(products.length);
        } catch (error) {
            console.error('Failed to load products:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
            <h2>Danh sách sản phẩm</h2>
            <Row gutter={[16, 16]}>
                {data.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((product) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={product.productId}>
                        <ProductCard product={product} />
                    </Col>
                ))}
            </Row>
            <div style={{ textAlign: 'center', marginTop: 32 }}>
                <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={total}
                    onChange={(page) => setCurrentPage(page)}
                />
            </div>
        </div>
    );
}