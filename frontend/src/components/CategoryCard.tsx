import { Card } from "antd";
import type { Category } from "../types";
import { Link } from "react-router-dom";
interface Props {
    category: Category;
}

export default function CategoryCard({ category }: Props) {
    console.log(category.id)
    return (
        <Link to={`/categories/${category.id}/products`}>
            <Card
                hoverable
                cover={
                    <img
                        alt={category.name}
                        /* src={category.imageUrl} */ src={"https://placehold.co/600x400"}
                        style={{ height: 200, objectFit: 'cover' }}
                    />
                }
            >
                <Card.Meta title={category.name} description={category.description} />
            </Card>
        </Link>
    )
}