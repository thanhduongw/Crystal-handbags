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
    message,
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

    const [product, setProduct] = useState<ProductDetailDto | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<ProductListDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<ProductItemDto | null>(null);
    const [qty, setQty] = useState(1);
    const [activeImage, setActiveImage] = useState<string>('');
    const [addingToCart, setAddingToCart] = useState(false);

    useEffect(() => {
        if (!id || isNaN(productId)) return;
        loadProduct();
    }, [productId, id]);

    useEffect(() => {
        if (product) {
            const defaultImage = product.avatar || product.images?.[0] || '';
            setActiveImage(defaultImage);
        }
    }, [product]);

    const loadProduct = async () => {
        try {
            setLoading(true);
            const currentProduct = await fetchProductDetail(productId);
            setProduct(currentProduct);
            setSelectedItem(currentProduct.items?.[0] || null);

            const allProducts = await fetchProducts();
            setRelatedProducts(
                allProducts.filter(
                    (pr) =>
                        pr.categoryName === currentProduct.categoryName &&
                        pr.productId !== currentProduct.productId
                )
            );
        } catch (error) {
            console.error('Failed to load product:', error);
            message.error('Không thể tải thông tin sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async () => {
        if (!selectedItem || !product) return;

        try {
            setAddingToCart(true);
            await addItem(product, selectedItem, qty);
            message.success('Đã thêm vào giỏ hàng!');
        } catch (error) {
            message.error('Không thể thêm vào giỏ hàng!');
        } finally {
            setAddingToCart(false);
        }
    };

    if (!id || isNaN(productId)) {
        return <Navigate to="/" replace />;
    }

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh'
            }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!product) {
        return <Navigate to="/" replace />;
    }

    const colors = [...new Set((product.items || []).map((i) => i.color))];
    const allImages = [
        ...(product.avatar ? [product.avatar] : []),
        ...(product.images || [])
    ].filter((img, index, self) => img && self.indexOf(img) === index);

    return (
        <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 16px' }}>
            <Card style={{ marginBottom: 24 }}>
                <Row gutter={[32, 32]}>
                    {/* Image Section */}
                    <Col xs={24} md={12}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: 12,
                                overflow: 'hidden',
                                border: '1px solid #f0f0f0',
                                marginBottom: 16,
                                background: '#fafafa',
                                minHeight: 400,
                            }}
                        >
                            <Image
                                src={activeImage || 'https://placehold.co/400x400?text=No+Image'}
                                alt={product.name}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: 500,
                                    objectFit: 'contain'
                                }}
                                fallback="https://placehold.co/400x400?text=Error"
                            />
                        </div>

                        {allImages.length > 1 && (
                            <Carousel
                                slidesToShow={Math.min(6, allImages.length)}
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
                                {allImages.map((img, idx) => (
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
                                                transition: 'all 0.3s',
                                            }}
                                        >
                                            <img
                                                src={img}
                                                alt={`Thumbnail ${idx + 1}`}
                                                style={{
                                                    width: '100%',
                                                    height: 80,
                                                    objectFit: 'cover',
                                                    borderRadius: 4,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </Carousel>
                        )}
                    </Col>

                    {/* Info Section */}
                    <Col xs={24} md={12}>
                        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                            <div>
                                <Title level={2} style={{ marginBottom: 8 }}>
                                    {product.name}
                                </Title>
                                {product.categoryName && (
                                    <Tag color="blue">{product.categoryName}</Tag>
                                )}
                            </div>

                            <Divider style={{ margin: '8px 0' }} />

                            <div>
                                <Text type="secondary">Giá bán</Text>
                                <div>
                                    <Text
                                        style={{
                                            fontSize: 32,
                                            fontWeight: 600,
                                            color: '#ff4d4f'
                                        }}
                                    >
                                        {(selectedItem?.price || product.basePrice)?.toLocaleString()} ₫
                                    </Text>
                                </div>
                            </div>

                            {product.description && (
                                <Paragraph style={{ color: '#666' }}>
                                    {product.description}
                                </Paragraph>
                            )}

                            <Divider style={{ margin: '8px 0' }} />

                            {/* Color Selection */}
                            {colors.length > 0 && (
                                <div>
                                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                        Màu sắc
                                    </Text>
                                    <Select
                                        value={selectedItem?.color}
                                        onChange={(color) => {
                                            const item = (product.items || []).find(
                                                (i) => i.color === color
                                            );
                                            setSelectedItem(item || null);
                                            setQty(1);
                                        }}
                                        style={{ width: '100%' }}
                                        size="large"
                                    >
                                        {colors.map((color) => (
                                            <Select.Option key={color} value={color}>
                                                {color}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </div>
                            )}

                            {/* Quantity Selection */}
                            <div>
                                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                    Số lượng
                                </Text>
                                <InputNumber
                                    min={1}
                                    max={selectedItem?.stockQuantity || 1}
                                    value={qty}
                                    onChange={(v) => setQty(v || 1)}
                                    style={{ width: '100%' }}
                                    size="large"
                                />
                                {selectedItem && (
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: 12, display: 'block', marginTop: 4 }}
                                    >
                                        Còn {selectedItem.stockQuantity} sản phẩm
                                    </Text>
                                )}
                            </div>

                            {/* Add to Cart Button */}
                            <Button
                                type="primary"
                                size="large"
                                icon={<ShoppingCartOutlined />}
                                disabled={!selectedItem || selectedItem.stockQuantity === 0}
                                loading={addingToCart}
                                onClick={handleAddToCart}
                                block
                                style={{ height: 50 }}
                            >
                                {selectedItem?.stockQuantity === 0
                                    ? 'Hết hàng'
                                    : 'Thêm vào giỏ hàng'}
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <div>
                    <Title level={3} style={{ marginBottom: 24 }}>
                        Sản phẩm liên quan
                    </Title>
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