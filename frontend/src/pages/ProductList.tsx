import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
    Col,
    Row,
    Spin,
    Pagination,
    Typography,
    Card,
    Slider,
    Select,
    Button,
    Space,
    Radio,
    Divider,
    Empty,
} from 'antd';
import { FilterOutlined, ClearOutlined } from '@ant-design/icons';
import { fetchProducts, fetchProductsByCat, searchProducts } from '../api/productAPI';
import ProductCard from '../components/ProductCard';
import { fetchCategory, fetchCategories } from '../api/categoryAPI';
import type { CategoryDto, ProductListDto } from '../types';

const { Title, Text } = Typography;

export default function ProductList() {
    const { id } = useParams<{ id?: string }>();
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('q');
    const categoryId = id ? Number(id) : null;

    const [data, setData] = useState<ProductListDto[]>([]);
    const [filteredData, setFilteredData] = useState<ProductListDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [category, setCategory] = useState<CategoryDto>();
    const [categories, setCategories] = useState<CategoryDto[]>([]);

    // Filter states
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
    const [maxPrice, setMaxPrice] = useState(10000000);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<string>('default');

    const pageSize = 12;

    // Load categories on mount
    useEffect(() => {
        loadCategories();
    }, []);

    // Load products when route changes
    useEffect(() => {
        loadProducts();
        setCurrentPage(1);
    }, [id, searchQuery]);

    // Apply filters when data or filters change
    useEffect(() => {
        applyFilters();
    }, [data, priceRange, selectedCategory, sortBy]);

    const loadCategories = async () => {
        try {
            setCategoriesLoading(true);
            const cats = await fetchCategories();
            setCategories(cats);
        } catch (error) {
            console.error('Failed to load categories:', error);
        } finally {
            setCategoriesLoading(false);
        }
    };

    const loadProducts = async () => {
        try {
            setLoading(true);
            let products: ProductListDto[];

            if (searchQuery) {
                // Search mode
                products = await searchProducts(searchQuery);
                setSelectedCategory(null);
            } else if (categoryId && !isNaN(categoryId)) {
                // Category filter mode
                products = await fetchProductsByCat(categoryId);
                const cat = await fetchCategory(categoryId);
                setCategory(cat);
                setSelectedCategory(categoryId);
            } else {
                // All products mode
                products = await fetchProducts();
                setSelectedCategory(null);
            }

            setData(products);

            // Calculate max price
            if (products.length > 0) {
                const max = Math.max(...products.map(p => p.basePrice));
                setMaxPrice(max);
                setPriceRange([0, max]);
            } else {
                setMaxPrice(10000000);
                setPriceRange([0, 10000000]);
            }
        } catch (error) {
            console.error('Failed to load products:', error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...data];

        // Price filter
        filtered = filtered.filter(
            p => p.basePrice >= priceRange[0] && p.basePrice <= priceRange[1]
        );

        // Category filter (only if not coming from URL category)
        if (selectedCategory && !categoryId) {
            filtered = filtered.filter(p => {
                const cat = categories.find(c => c.name === p.categoryName);
                return cat?.categoryId === selectedCategory;
            });
        }

        // Sorting
        switch (sortBy) {
            case 'price-asc':
                filtered.sort((a, b) => a.basePrice - b.basePrice);
                break;
            case 'price-desc':
                filtered.sort((a, b) => b.basePrice - a.basePrice);
                break;
            case 'name-asc':
                filtered.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
                break;
            case 'name-desc':
                filtered.sort((a, b) => b.name.localeCompare(a.name, 'vi'));
                break;
            default:
                // Keep original order
                break;
        }

        setFilteredData(filtered);
    };

    const handleClearFilters = () => {
        setPriceRange([0, maxPrice]);
        setSelectedCategory(categoryId);
        setSortBy('default');
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    };

    // Paginated data
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        return filteredData.slice(start, end);
    }, [filteredData, currentPage, pageSize]);

    // Page title
    const pageTitle = useMemo(() => {
        if (searchQuery) return `Kết quả tìm kiếm: "${searchQuery}"`;
        if (categoryId && category) return category.name;
        return 'Tất cả sản phẩm';
    }, [searchQuery, categoryId, category]);

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

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 16px' }}>
            <Row gutter={24}>
                {/* Filter Sidebar */}
                <Col xs={24} md={6}>
                    <Card
                        title={
                            <Space>
                                <FilterOutlined />
                                <span>Bộ lọc</span>
                            </Space>
                        }
                        extra={
                            <Button
                                type="link"
                                icon={<ClearOutlined />}
                                onClick={handleClearFilters}
                                size="small"
                            >
                                Xóa
                            </Button>
                        }
                        style={{ marginBottom: 16, position: 'sticky', top: 80 }}
                    >
                        {/* Category Filter */}
                        {!categoryId && (
                            <>
                                <Title level={5}>Danh mục</Title>
                                {categoriesLoading ? (
                                    <Spin size="small" />
                                ) : categories.length > 0 ? (
                                    <Radio.Group
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        style={{ width: '100%' }}
                                    >
                                        <Space orientation="vertical" style={{ width: '100%' }}>
                                            <Radio value={undefined}>Tất cả</Radio>
                                            {categories.map(cat => (
                                                <Radio key={cat.categoryId} value={cat.categoryId}>
                                                    {cat.name}
                                                </Radio>
                                            ))}
                                        </Space>
                                    </Radio.Group>
                                ) : (
                                    <Empty
                                        description="Không có danh mục"
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    />
                                )}
                                <Divider />
                            </>
                        )}

                        {/* Price Range Filter */}
                        <Title level={5}>Khoảng giá</Title>
                        <Slider
                            range
                            min={0}
                            max={maxPrice}
                            step={100000}
                            value={priceRange}
                            onChange={(value) => setPriceRange(value as [number, number])}
                            tooltip={{
                                formatter: (value) => formatPrice(value || 0)
                            }}
                        />
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: 8
                        }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {formatPrice(priceRange[0])}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {formatPrice(priceRange[1])}
                            </Text>
                        </div>
                    </Card>
                </Col>

                {/* Products Grid */}
                <Col xs={24} md={18}>
                    {/* Header */}
                    <div style={{ marginBottom: 16 }}>
                        <Row justify="space-between" align="middle" gutter={[16, 16]}>
                            <Col xs={24} sm={12}>
                                <Title level={3} style={{ margin: 0 }}>
                                    {pageTitle}
                                </Title>
                                <Text type="secondary">
                                    {filteredData.length} sản phẩm
                                </Text>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                                    <Text>Sắp xếp:</Text>
                                    <Select
                                        value={sortBy}
                                        onChange={setSortBy}
                                        style={{ width: 200 }}
                                        options={[
                                            { value: 'default', label: 'Mặc định' },
                                            { value: 'price-asc', label: 'Giá: Thấp → Cao' },
                                            { value: 'price-desc', label: 'Giá: Cao → Thấp' },
                                            { value: 'name-asc', label: 'Tên: A → Z' },
                                            { value: 'name-desc', label: 'Tên: Z → A' },
                                        ]}
                                    />
                                </Space>
                            </Col>
                        </Row>
                    </div>

                    {/* Products or Empty State */}
                    {paginatedData.length > 0 ? (
                        <>
                            <Row gutter={[16, 16]}>
                                {paginatedData.map((product) => (
                                    <Col
                                        xs={24}
                                        sm={12}
                                        lg={8}
                                        key={product.productId}
                                    >
                                        <ProductCard product={product} />
                                    </Col>
                                ))}
                            </Row>

                            {/* Pagination */}
                            <div style={{ textAlign: 'center', marginTop: 32 }}>
                                <Pagination
                                    current={currentPage}
                                    pageSize={pageSize}
                                    total={filteredData.length}
                                    onChange={(page) => {
                                        setCurrentPage(page);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    showSizeChanger={false}
                                    showTotal={(total) => `Tổng ${total} sản phẩm`}
                                />
                            </div>
                        </>
                    ) : (
                        <Card>
                            <Empty
                                description={
                                    searchQuery
                                        ? `Không tìm thấy sản phẩm nào cho "${searchQuery}"`
                                        : "Không tìm thấy sản phẩm nào"
                                }
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                style={{ padding: '48px 0' }}
                            >
                                {searchQuery && (
                                    <Button type="primary" onClick={() => window.history.back()}>
                                        Quay lại
                                    </Button>
                                )}
                            </Empty>
                        </Card>
                    )}
                </Col>
            </Row>
        </div>
    );
}   