import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
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
    Alert
} from "antd";
import { LoadingOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import type { Product, ProductItem } from "../types";
import { fetchProductDetail, fetchProducts } from "../api/productAPI";
import ProductCard from "../components/ProductCard";
import useCart from "../hooks/useCart";

const { Title, Text, Paragraph } = Typography;

export default function ProductDetail() {
    const { id } = useParams<{ id: string }>();
    const productId = Number(id);

    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<ProductItem | null>(null);
    const [qty, setQty] = useState(1);
    const [mainImg, setMainImg] = useState<string>();

    const [alert, setAlert] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    const { addItem } = useCart();

    if (!id || isNaN(productId)) return <Navigate to="/" replace />;

    /* ================= FETCH PRODUCT ================= */
    useEffect(() => {
        setLoading(true);

        let currentProduct: Product;

        fetchProductDetail(productId)
            .then(p => {
                currentProduct = p;
                setProduct(p);
                setSelectedItem(p.items?.[0] || null);
                setMainImg(p.images?.[0]);
                return fetchProducts();
            })
            .then(allProducts => {
                setRelatedProducts(
                    allProducts.filter(pr =>
                        pr.categoryName === currentProduct.categoryName &&
                        pr.productId !== currentProduct.productId
                    )
                );
            })
            .finally(() => setLoading(false));
    }, [productId]);

    /* ================= IMAGE BY COLOR ================= */
    useEffect(() => {
        if (!product || !selectedItem) return;
        const imgByColor = product.images.find(img =>
            img.toLowerCase().includes(selectedItem.color.toLowerCase())
        );
        if (imgByColor) setMainImg(imgByColor);
    }, [selectedItem, product]);

    /* ================= AUTO HIDE ALERT ================= */
    useEffect(() => {
        if (!alert) return;
        const timer = setTimeout(() => setAlert(null), 500);
        return () => clearTimeout(timer);
    }, [alert]);

    if (loading) {
        return (
            <Spin
                style={{ display: "block", margin: "100px auto" }}
                indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
            />
        );
    }

    if (!product) return null;

    const colors = [...new Set(product.items.map(i => i.color))];

    return (
        <Row justify="center" style={{ padding: "32px 16px" }}>
            {/* ✅ ALERT GÓC PHẢI */}
            {alert && (
                <div
                    style={{
                        position: "fixed",
                        top: 32,
                        right: 32,
                        zIndex: 1000,
                        width: 320,
                    }}
                >
                    <Alert
                        message={alert.message}
                        type={alert.type}
                        showIcon
                        closable
                        onClose={() => setAlert(null)}
                    />
                </div>
            )}

            <Col xs={24} lg={20}>
                <Card style={{ borderRadius: 16 }}>
                    <Row gutter={[24, 24]}>
                        {/* ================= LEFT ================= */}
                        <Col xs={24} md={12}>
                            <div
                                style={{
                                    background: "#f5f5f5",
                                    borderRadius: 16,
                                    padding: 16,
                                }}
                            >
                                <Image
                                    src="https://placehold.co/600x400"
                                    alt={product.name}
                                    style={{
                                        width: "100%",
                                        height: 480,
                                        objectFit: "cover",
                                    }}
                                />

                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        marginTop: 12,
                                        gap: 8,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    {product.images.map((img, idx) => (
                                        <img
                                            key={idx}
                                            src="https://placehold.co/600x400"
                                            style={{
                                                width: 60,
                                                height: 60,
                                                objectFit: "cover",
                                                border:
                                                    mainImg === img
                                                        ? "2px solid #1890ff"
                                                        : "1px solid #ccc",
                                                borderRadius: 4,
                                                cursor: "pointer",
                                            }}
                                            onClick={() => setMainImg(img)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </Col>

                        {/* ================= RIGHT ================= */}
                        <Col xs={24} md={12}>
                            <Title level={2}>{product.name}</Title>
                            <Tag color="blue">{product.categoryName}</Tag>
                            <Divider />

                            <Text
                                style={{
                                    fontSize: 28,
                                    fontWeight: 600,
                                    color: "#cf1322",
                                }}
                            >
                                {selectedItem?.price?.toLocaleString()} ₫
                            </Text>

                            <Paragraph style={{ marginTop: 12 }}>
                                {product.description}
                            </Paragraph>

                            {/* COLOR */}
                            <Text strong>Màu sắc</Text>
                            <Select
                                size="large"
                                style={{ width: "100%", marginTop: 8 }}
                                value={selectedItem?.color}
                                onChange={(color) => {
                                    const item = product.items.find(i => i.color === color);
                                    setSelectedItem(item || null);
                                    setQty(1);
                                }}
                            >
                                {colors.map(color => (
                                    <Select.Option key={color} value={color}>
                                        {color}
                                    </Select.Option>
                                ))}
                            </Select>

                            {/* SIZE */}
                            <Text strong style={{ marginTop: 16, display: "block" }}>
                                Size
                            </Text>
                            <Select
                                size="large"
                                style={{ width: "100%", marginTop: 8 }}
                                value={selectedItem?.itemId}
                                onChange={(itemId) => {
                                    const item = product.items.find(i => i.itemId === itemId);
                                    setSelectedItem(item || null);
                                }}
                            >
                                {product.items
                                    .filter(i => i.color === selectedItem?.color)
                                    .map(item => (
                                        <Select.Option key={item.itemId} value={item.itemId}>
                                            {item.size}
                                        </Select.Option>
                                    ))}
                            </Select>

                            {/* QTY */}
                            <Text strong style={{ marginTop: 16, display: "block" }}>
                                Số lượng
                            </Text>
                            <InputNumber
                                min={1}
                                max={selectedItem?.stockQuantity}
                                value={qty}
                                size="large"
                                onChange={(v) => setQty(v || 1)}
                            />
                            <Text type="secondary" style={{ marginLeft: 12 }}>
                                Còn {selectedItem?.stockQuantity} sản phẩm
                            </Text>

                            {/* ADD TO CART */}
                            <Button
                                type="primary"
                                size="large"
                                icon={<ShoppingCartOutlined />}
                                style={{ marginTop: 32, width: "100%", height: 50 }}
                                disabled={!selectedItem}
                                onClick={async () => {
                                    try {
                                        await addItem(product, selectedItem!, qty);
                                        setAlert({
                                            type: "success",
                                            message: "Đã thêm vào giỏ hàng",
                                        });
                                    } catch {
                                        setAlert({
                                            type: "error",
                                            message: "Không thể thêm vào giỏ hàng",
                                        });
                                    }
                                }}
                            >
                                Thêm vào giỏ hàng
                            </Button>
                        </Col>
                    </Row>
                </Card>

                {/* ================= RELATED ================= */}
                <div style={{ marginTop: 64 }}>
                    <Title level={3}>Có thể bạn cũng thích</Title>
                    <Row gutter={[16, 16]}>
                        {relatedProducts.slice(0, 4).map(p => (
                            <Col xs={24} sm={12} md={6} key={p.productId}>
                                <ProductCard product={p} />
                            </Col>
                        ))}
                    </Row>
                </div>
            </Col>
        </Row>
    );
}
