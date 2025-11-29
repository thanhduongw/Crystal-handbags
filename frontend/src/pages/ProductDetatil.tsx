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
    Tag
} from "antd";
import { LoadingOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import type { Product, ProductItem } from "../types";
import { fetchProductDetail, fetchProducts } from "../api/productAPI";
import ProductCard from "../components/ProductCard";

const { Title, Text, Paragraph } = Typography;
const PLACEHOLDER = "https://placehold.co/600x400";

export default function ProductDetail() {
    const { id } = useParams<{ id: string }>();
    const productId = Number(id);

    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<ProductItem | null>(null);
    const [qty, setQty] = useState(1);
    const [mainImg, setMainImg] = useState<string>();

    if (!id || isNaN(productId)) return <Navigate to="/" replace />;

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

    useEffect(() => {
        if (!product || !selectedItem) return;
        const imgByColor = product.images.find(img =>
            img.toLowerCase().includes(selectedItem.color.toLowerCase())
        );
        if (imgByColor) setMainImg(imgByColor);
    }, [selectedItem, product]);

    if (loading)
        return (
            <Spin
                style={{ display: "flex", justifyContent: "center", marginTop: 120 }}
                indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
            />
        );

    if (!product) return null;

    const colors = [...new Set(product.items.map(i => i.color))];

    return (
        <Row justify="center" style={{ padding: "32px 16px" }}>
            <Col xs={24} lg={20}>
                <Card style={{ borderRadius: 16 }}>
                    <Row gutter={[32, 32]}>
                        {/* LEFT - IMAGE + THUMBNAILS */}
                        <Col xs={24} md={12}>
                            <div
                                style={{
                                    background: "#f5f5f5",
                                    borderRadius: 16,
                                    padding: 16,
                                    textAlign: "center"
                                }}
                            >
                                <img
                                    /* src={mainImg} */ src={"https://placehold.co/600x400"}
                                    alt={product.name}
                                    style={{
                                        width: "100%",
                                        height: 420,
                                        objectFit: "cover",
                                        transition: "transform .3s",
                                    }}
                                />
                                {/* THUMBNAILS */}
                                <div style={{ display: "flex", justifyContent: "center", marginTop: 12, gap: 8, flexWrap: "wrap" }}>
                                    {(product.images.length ? product.images : [PLACEHOLDER]).map((img, idx) => (
                                        <img
                                            key={idx}
                                            /* src={img} */ src={"https://placehold.co/600x400"}
                                            alt={`thumb-${idx}`}
                                            style={{
                                                width: 60,
                                                height: 60,
                                                objectFit: "cover",
                                                border: mainImg === img ? "2px solid #1890ff" : "1px solid #ccc",
                                                borderRadius: 4,
                                                cursor: "pointer"
                                            }}
                                            onClick={() => setMainImg(img)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </Col>

                        {/* RIGHT - INFO */}
                        <Col xs={24} md={12}>
                            <Title level={2} style={{ marginBottom: 0 }}>{product.name}</Title>
                            <Tag color="blue" style={{ marginTop: 8 }}>{product.categoryName}</Tag>
                            <Divider />
                            <Text style={{ fontSize: 28, fontWeight: 600, color: "#cf1322" }}>
                                {selectedItem?.price?.toLocaleString()} ₫
                            </Text>
                            <Paragraph style={{ marginTop: 12, color: "#555" }}>{product.description}</Paragraph>

                            {/* COLOR */}
                            <div style={{ marginTop: 24 }}>
                                <Text strong>Màu sắc</Text>
                                <Select
                                    size="large"
                                    style={{ width: "100%", marginTop: 8 }}
                                    value={selectedItem?.color}
                                    onChange={color => {
                                        const item = product.items.find(i => i.color === color);
                                        setSelectedItem(item || null);
                                        setQty(1);
                                    }}
                                >
                                    {colors.map(color => (
                                        <Select.Option key={color} value={color}>{color}</Select.Option>
                                    ))}
                                </Select>
                            </div>

                            {/* SIZE */}
                            <div style={{ marginTop: 16 }}>
                                <Text strong>Size</Text>
                                <Select
                                    size="large"
                                    style={{ width: "100%", marginTop: 8 }}
                                    value={selectedItem?.itemId}
                                    onChange={itemId => {
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
                            </div>

                            {/* QUANTITY */}
                            <div style={{ marginTop: 16 }}>
                                <Text strong>Số lượng</Text>
                                <div style={{ marginTop: 8, display: "flex", alignItems: "center" }}>
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
                                </div>
                            </div>

                            {/* ADD TO CART */}
                            <Button
                                type="primary"
                                size="large"
                                icon={<ShoppingCartOutlined />}
                                style={{
                                    marginTop: 32,
                                    height: 50,
                                    width: "100%",
                                    fontSize: 16,
                                    borderRadius: 12
                                }}
                                disabled={!selectedItem}
                            >
                                Thêm vào giỏ hàng
                            </Button>
                        </Col>
                    </Row>
                </Card>

                {/* ================= RELATED PRODUCTS ================= */}
                <div style={{ marginTop: 64 }}>
                    <Title level={3} style={{ marginBottom: 0 }}>Có thể bạn cũng thích</Title>
                    <Text type="secondary">Các sản phẩm cùng danh mục</Text>
                    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                        {relatedProducts.slice(0, 4).map(p => (
                            <Col xs={24} sm={12} md={6} key={p.productId}>
                                <ProductCard product={p} />
                            </Col>
                        ))}
                    </Row>
                    {!relatedProducts.length && (
                        <Text type="secondary">Không có sản phẩm gợi ý.</Text>
                    )}
                </div>
            </Col>
        </Row>
    );
}
