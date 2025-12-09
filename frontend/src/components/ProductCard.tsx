import { Card } from "antd";
import type { ProductListDto } from "../types";
import { Link } from "react-router-dom";

interface Props {
    product: ProductListDto;
}

export default function ProductCard({ product }: Props) {
    return (
        <Link to={`/products/${product.productId}`}>
            <Card
                hoverable
                style={{ width: "100%", borderRadius: 10 }}
                cover={
                    <img
                        src={product.avatar}
                        alt={product.name}
                        style={{
                            height: 380,
                            objectFit: "cover",
                            borderTopLeftRadius: 10,
                            borderTopRightRadius: 10,
                        }}
                    />
                }
            >
                <Card.Meta
                    title={product.name}
                    description={`${product.basePrice.toLocaleString()} đ`}
                />
            </Card>
        </Link>
    );
}
