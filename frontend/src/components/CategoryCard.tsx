import { Card } from "antd";
import type { CategoryDto } from "../types";
import { Link } from "react-router-dom";
interface Props {
    category: CategoryDto;
}

export default function CategoryCard({ category }: Props) {
    console.log(category.categoryId)
    return (
        <Link to={`/categories/${category.categoryId}/products`}>
            <Card
                hoverable
                cover={
                    <img
                        alt={category.name}
                        src={category.imageUrl}
                        style={{ height: 300, objectFit: 'cover' }}
                    />
                }
            >
                <Card.Meta title={category.name} description={category.description} />
            </Card>
        </Link>
    )
}