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
    Carousel,
} from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { fetchProductDetail, fetchProducts } from '../api/productAPI';
import ProductCard from '../components/ProductCard';
import useCart from '../hooks/useCart';
import type { ProductDetailDto, ProductItemDto, ProductListDto } from '../types';

const { Title, Text, Paragraph } = Typography;

export default function ProductDetail() {
    const { id } = useParams<{ id: string }>();
    const productId = Number(id);
    const { addItem } = useCart();
    const [activeImage, setActiveImage] = useState<string>('');


    const [product, setProduct] = useState<ProductDetailDto | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<ProductListDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<ProductItemDto | null>(null);
    const [qty, setQty] = useState(1);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    if (!id || isNaN(productId)) return <Navigate to="/" replace />;

    useEffect(() => {
        loadProduct();
    }, [productId]);
    useEffect(() => {
        if (product?.images?.length) {
            setActiveImage(product.images[0]);
        }
    }, [product]);


    useEffect(() => {
        if (!alert) return;
        const timer = setTimeout(() => setAlert(null), 500);
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

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
            {alert && (
                <Alert
                    title={alert.message}
                    type={alert.type}
                    showIcon
                    closable
                    style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000, width: 300 }}
                    onClose={() => setAlert(null)}
                />
            )}

            <Card style={{ marginTop: 12 }}>
                <Row gutter={[24, 24]}>
                    <Col xs={24} md={12}>
                        <div
                            style={{
                                display: 'flex',               // căn giữa
                                justifyContent: 'center',
                                alignItems: 'center',            // chiều cao khung
                                borderRadius: 12,
                                overflow: 'hidden',
                                border: '1px solid #f0f0f0',
                                marginBottom: 12,
                            }}
                        >
                            <Image
                                src={activeImage}
                                alt={product.name}
                                width={'90%'}
                                style={{ objectFit: 'contain' }}
                            />
                        </div>

                        <Carousel
                            slidesToShow={6}
                            infinite={false}
                            arrows
                            draggable
                            swipeToSlide
                            dots={false}
                            responsive={[
                                { breakpoint: 1024, settings: { slidesToShow: 4 } },
                                { breakpoint: 768, settings: { slidesToShow: 3 } },
                                { breakpoint: 480, settings: { slidesToShow: 2 } },
                            ]}
                        >
                            {product.images.map((img, idx) => (
                                <div key={idx} style={{ padding: '0 6px' }}>
                                    <div
                                        onClick={() => setActiveImage(img)}
                                        style={{
                                            border: activeImage === img
                                                ? '2px solid #1677ff'
                                                : '1px solid #eee',
                                            borderRadius: 6,
                                            padding: 4,
                                            cursor: 'pointer',
                                            background: '#fff',
                                        }}
                                    >
                                        <Image
                                            src={img}
                                            preview={false}
                                            style={{
                                                objectFit: 'contain',
                                                borderRadius: 4,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </Carousel>
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

                        <Space orientation="vertical" style={{ width: '100%' }}>
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