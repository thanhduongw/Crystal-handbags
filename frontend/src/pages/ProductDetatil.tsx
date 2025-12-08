import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import {
    Button,
    Col,
    Row,
    Typography,
    Select,
    Spin,
    Card,
    InputNumber,
    Divider,
    Tag,
    Image,
    Alert,
    Space,
} from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import type { Product, ProductItem } from '../types';
import { fetchProductDetail, fetchProducts } from '../api/productAPI';
import ProductCard from '../components/ProductCard';
import useCart from '../hooks/useCart';

const { Title, Text, Paragraph } = Typography;

export default function ProductDetail() {
    const { id } = useParams<{ id: string }>();
    const productId = Number(id);
    const { addItem } = useCart();

    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<ProductItem | null>(null);
    const [qty, setQty] = useState(1);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    if (!id || isNaN(productId)) return <Navigate to="/" replace />;

    useEffect(() => {
        loadProduct();
    }, [productId]);

    useEffect(() => {
        if (!alert) return;
        const timer = setTimeout(() => setAlert(null), 3000);
        return () => clearTimeout(timer);
    }, [alert]);

    const loadProduct = async () => {
        try {
            setLoading(true);
            const currentProduct = await fetchProductDetail(productId);
            setProduct(currentProduct);
            setSelectedItem(currentProduct.items[0] || null);

            const allProducts = await fetchProducts();
            setRelatedProducts(
                allProducts.filter(
                    (pr) => pr.categoryName === currentProduct.categoryName && pr.productId !== currentProduct.productId
                )
            );
        } catch (error) {
            console.error('Failed to load product:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Spin
                style={{ display: 'block', margin: '100px auto' }}
                size="large"
            />
        );
    }

    if (!product) return <Navigate to="/" replace />;

    const colors = [...new Set(product.items.map((i) => i.color))];
    const sizes = product.items.filter((i) => i.color === selectedItem?.color);

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
            {alert && (
                <Alert
                    message={alert.message}
                    type={alert.type}
                    showIcon
                    closable
                    style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000, width: 300 }}
                    onClose={() => setAlert(null)}
                />
            )}

            <Card style={{ marginTop: 24 }}>
                <Row gutter={[24, 24]}>
                    <Col xs={24} md={12}>
                        <Image
                            src={product.images[0] || 'https://placehold.co/600x400'}
                            alt={product.name}
                            style={{ width: '100%', height: 400, objectFit: 'cover', borderRadius: 8 }}
                        />
                        <Space style={{ marginTop: 16, overflowX: 'auto', width: '100%' }}>
                            {product.images.map((img, idx) => (
                                <Image
                                    key={idx}
                                    src={img || 'https://placehold.co/600x400'}
                                    alt={`${product.name}-${idx}`}
                                    width={80}
                                    height={80}
                                    style={{ objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                                    onClick={() => window.open(img, '_blank')}
                                />
                            ))}
                        </Space>
                    </Col>

                    <Col xs={24} md={12}>
                        <Title level={2}>{product.name}</Title>
                        <Tag color="blue">{product.categoryName}</Tag>
                        <Divider />

                        <Paragraph>
                            <Text strong>Giá: </Text>
                            <Text type="danger" style={{ fontSize: 24 }}>
                                {selectedItem?.price?.toLocaleString()} ₫
                            </Text>
                        </Paragraph>

                        <Paragraph>{product.description}</Paragraph>

                        <Divider />

                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Text strong>Màu sắc:</Text>
                            <Select
                                value={selectedItem?.color}
                                onChange={(color) => {
                                    const item = product.items.find((i) => i.color === color);
                                    setSelectedItem(item || null);
                                    setQty(1);
                                }}
                                style={{ width: '100%' }}
                            >
                                {colors.map((color) => (
                                    <Select.Option key={color} value={color}>
                                        {color}
                                    </Select.Option>
                                ))}
                            </Select>

                            <Text strong>Size:</Text>
                            <Select
                                value={selectedItem?.itemId}
                                onChange={(itemId) => {
                                    const item = product.items.find((i) => i.itemId === itemId);
                                    setSelectedItem(item || null);
                                }}
                                style={{ width: '100%' }}
                            >
                                {sizes.map((item) => (
                                    <Select.Option key={item.itemId} value={item.itemId}>
                                        {item.size} (Còn {item.stockQuantity})
                                    </Select.Option>
                                ))}
                            </Select>

                            <Text strong>Số lượng:</Text>
                            <InputNumber
                                min={1}
                                max={selectedItem?.stockQuantity || 1}
                                value={qty}
                                onChange={(v) => setQty(v || 1)}
                                style={{ width: '100%' }}
                            />

                            <Button
                                type="primary"
                                size="large"
                                icon={<ShoppingCartOutlined />}
                                disabled={!selectedItem}
                                onClick={async () => {
                                    if (!selectedItem) return;
                                    try {
                                        await addItem(product, selectedItem, qty);
                                        setAlert({ type: 'success', message: 'Đã thêm vào giỏ hàng!' });
                                    } catch {
                                        setAlert({ type: 'error', message: 'Không thể thêm vào giỏ hàng!' });
                                    }
                                }}
                                style={{ marginTop: 16, width: '100%' }}
                            >
                                Thêm vào giỏ hàng
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {relatedProducts.length > 0 && (
                <div style={{ marginTop: 48 }}>
                    <Title level={3}>Sản phẩm liên quan</Title>
                    <Row gutter={[16, 16]}>
                        {relatedProducts.slice(0, 4).map((p) => (
                            <Col xs={24} sm={12} md={6} key={p.productId}>
                                <ProductCard product={p} />
                            </Col>
                        ))}
                    </Row>
                </div>
            )}
        </div>
    );
}