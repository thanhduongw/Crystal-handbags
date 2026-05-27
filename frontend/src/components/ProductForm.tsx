import { useEffect, useState } from 'react';
import {
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    Button,
    Switch,
    message,
    Card,
    Row,
    Col,
    Upload,
    Image,
    Divider,
    Space,
} from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    UploadOutlined,
    PictureOutlined,
    StarOutlined,
} from '@ant-design/icons';
import type { CategoryDto, ProductDetailDto } from '../types';
import { fetchCategories } from '../api/categoryAPI';

export type ProductFormUploadFiles = {
  avatarFile?: File;
  imageFiles?: File[];
};

interface ProductFormProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (
        product: ProductDetailDto,
        isEdit: boolean,
        files?: ProductFormUploadFiles
    ) => void;
    initialValues?: ProductDetailDto;
    isEdit?: boolean;
    submitting?: boolean;
}

type ProductFormValues = {
    name: string;
    description: string;
    basePrice: number;
    categoryId: number;
    showHomePage?: boolean;
    items?: ProductDetailDto['items'];
    avatar?: string;
    images?: Array<string | null | undefined>;
};

export default function ProductForm({
    visible,
    onCancel,
    onSubmit,
    initialValues,
    isEdit = false,
    submitting = false,
}: ProductFormProps) {
    const [form] = Form.useForm();
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [loadingCats, setLoadingCats] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | undefined>();
    const [avatarFile, setAvatarFile] = useState<File | undefined>();
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    useEffect(() => {
        if (visible) {
            loadCategories();
            setAvatarFile(undefined);
            setImageFiles([]);
            setImagePreviews([]);
            if (initialValues) {
                form.setFieldsValue({
                    name: initialValues.name,
                    description: initialValues.description,
                    basePrice: initialValues.basePrice,
                    categoryId: initialValues.categoryId,
                    showHomePage: initialValues.showHomePage || false,
                    items:
                        initialValues.items && initialValues.items.length > 0
                            ? initialValues.items
                            : [{ color: '', price: 0, stockQuantity: 0 }],
                    avatar: initialValues.avatar || undefined,
                    images: initialValues.images || [],
                });
                setAvatarPreview(initialValues.avatar);
            } else {
                form.resetFields();
                form.setFieldsValue({
                    items: [{ color: '', price: 0, stockQuantity: 0 }],
                    images: [],
                });
                setAvatarPreview(undefined);
            }
        }
    }, [visible, initialValues, form]);

    const loadCategories = async () => {
        try {
            setLoadingCats(true);
            const data = await fetchCategories();
            setCategories(data);
        } catch (error) {
            console.error('Load categories error:', error);
            message.error('Không tải được danh mục');
        } finally {
            setLoadingCats(false);
        }
    };

    const handleFinish = (values: ProductFormValues) => {
        const images: string[] = (values.images || []).filter(
            (x): x is string => !!x && x.trim().length > 0
        );

        const product: ProductDetailDto = {
            productId: initialValues?.productId,
            name: values.name,
            description: values.description,
            basePrice: values.basePrice,
            categoryId: values.categoryId,
            showHomePage: values.showHomePage || false,
            items: values.items || [],
            avatar: avatarFile ? initialValues?.avatar : values.avatar || undefined,
            images,
        };

        onSubmit(product, isEdit, { avatarFile, imageFiles });
    };

    return (
        <Modal
            open={visible}
            title={isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
            onCancel={onCancel}
            onOk={() => form.submit()}
            width={1000}
            destroyOnClose
            okText={isEdit ? 'Cập nhật' : 'Thêm'}
            cancelText="Hủy"
            confirmLoading={submitting}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={{
                    items: [{ color: '', price: 0, stockQuantity: 0 }],
                    images: [],
                }}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="name"
                            label="Tên sản phẩm"
                            rules={[
                                { required: true, message: 'Vui lòng nhập tên sản phẩm!' },
                                { min: 3, message: 'Tên sản phẩm phải có ít nhất 3 ký tự!' },
                            ]}
                        >
                            <Input placeholder="Nhập tên sản phẩm" />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            name="categoryId"
                            label="Danh mục"
                            rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
                        >
                            <Select
                                loading={loadingCats}
                                placeholder="Chọn danh mục"
                                showSearch
                                optionFilterProp="children"
                            >
                                {categories.map((c) => (
                                    <Select.Option key={c.categoryId} value={c.categoryId}>
                                        {c.name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    name="description"
                    label="Mô tả"
                    rules={[
                        { required: true, message: 'Vui lòng nhập mô tả!' },
                        { min: 10, message: 'Mô tả phải có ít nhất 10 ký tự!' },
                    ]}
                >
                    <Input.TextArea rows={3} placeholder="Nhập mô tả sản phẩm" />
                </Form.Item>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="basePrice"
                            label="Giá cơ bản (VNĐ)"
                            rules={[
                                { required: true, message: 'Vui lòng nhập giá!' },
                                { type: 'number', min: 0, message: 'Giá phải lớn hơn 0!' },
                            ]}
                        >
                            <InputNumber
                                min={0}
                                style={{ width: '100%' }}
                                formatter={(value) =>
                                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                }
                                placeholder="Nhập giá sản phẩm"
                            />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            name="showHomePage"
                            label="Hiển thị trang chủ"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider>Ảnh đại diện (Avatar)</Divider>

                <Row gutter={16} align="middle">
                    <Col span={8}>
                        <Form.Item name="avatar" label="URL avatar">
                            <Input
                                placeholder="https://example.com/avatar.jpg"
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setAvatarFile(undefined);
                                    setAvatarPreview(v || undefined);
                                }}
                            />
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item label="Upload avatar (file)">
                            <Upload
                                listType="picture-card"
                                showUploadList={false}
                                beforeUpload={(file) => {
                                    const selectedFile = file as File;

                                    if (!selectedFile.type.startsWith('image/')) {
                                        message.error('Chỉ được chọn file ảnh');
                                        return false;
                                    }

                                    const isLt5M = selectedFile.size / 1024 / 1024 < 5;
                                    if (!isLt5M) {
                                        message.error('Ảnh phải nhỏ hơn 5MB');
                                        return false;
                                    }

                                    setAvatarFile(selectedFile);
                                    setAvatarPreview(URL.createObjectURL(selectedFile));

                                    // Không lưu base64 vào DB nữa.
                                    form.setFieldsValue({ avatar: undefined });

                                    message.success('Đã chọn ảnh');
                                    return false;
                                }}
                                accept="image/*"
                            >
                                <div>
                                    <UploadOutlined />
                                    <div style={{ marginTop: 8 }}>Upload avatar</div>
                                </div>
                            </Upload>
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <div>
                            <div style={{ marginBottom: 8, fontWeight: 500 }}>Preview</div>
                            {avatarPreview ? (
                                <Image
                                    src={avatarPreview}
                                    width={120}
                                    height={120}
                                    style={{ objectFit: 'cover', borderRadius: 6 }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: 120,
                                        height: 120,
                                        background: '#f5f5f5',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 6,
                                    }}
                                >
                                    <PictureOutlined style={{ fontSize: 24, color: '#999' }} />
                                </div>
                            )}
                        </div>
                    </Col>
                </Row>

                <Divider>Ảnh chi tiết (Images)</Divider>

                <Form.List name="images">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }, index) => {
                                const currentImages: string[] = form.getFieldValue('images') || [];
                                const preview = currentImages[index];

                                return (
                                    <Card key={key} size="small" style={{ marginBottom: 12 }}>
                                        <Row gutter={16} align="middle">
                                            <Col span={10}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name]}
                                                    rules={[{ required: true, message: 'Nhập URL ảnh' }]}
                                                >
                                                    <Input placeholder="Nhập URL ảnh" />
                                                </Form.Item>
                                            </Col>
                                                <Col span={4}>
                                                <Upload
                                                    showUploadList={false}
                                                    beforeUpload={(file) => {
                                                    const selectedFile = file as File;

                                                    if (!selectedFile.type.startsWith("image/")) {
                                                        message.error("Chỉ được chọn file ảnh");
                                                        return false;
                                                    }

                                                    const isLt5M = selectedFile.size / 1024 / 1024 < 5;
                                                    if (!isLt5M) {
                                                        message.error("Ảnh phải nhỏ hơn 5MB");
                                                        return false;
                                                    }

                                                    setImageFiles((prev) => [...prev, selectedFile]);
                                                    setImagePreviews((prev) => [...prev, URL.createObjectURL(selectedFile)]);

                                                    message.success("Đã chọn ảnh chi tiết");
                                                    return false;
                                                    }}
                                                    accept="image/*"
                                                >
                                                    <Button icon={<UploadOutlined />}>Upload</Button>
                                                </Upload>
                                                </Col>

                                            <Col span={4}>
                                                {preview ? (
                                                    <Image
                                                        src={preview}
                                                        width={80}
                                                        height={80}
                                                        style={{ objectFit: 'cover' }}
                                                        fallback="https://placehold.co/80x80?text=Error"
                                                    />
                                                ) : (
                                                    <div
                                                        style={{
                                                            width: 80,
                                                            height: 80,
                                                            background: '#f5f5f5',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        <PictureOutlined />
                                                    </div>
                                                )}
                                            </Col>

                                            <Col span={6}>
                                                <Space>
                                                    <Button
                                                        onClick={() => {
                                                            const images: string[] =
                                                                form.getFieldValue('images') || [];
                                                            const val = images[index];
                                                            if (!val) {
                                                                message.error('Ảnh rỗng');
                                                                return;
                                                            }

                                                            setAvatarFile(undefined);
                                                            form.setFieldsValue({ avatar: val });
                                                            setAvatarPreview(val);
                                                            message.success('Đã đặt ảnh này làm avatar');
                                                        }}
                                                        icon={<StarOutlined />}
                                                    >
                                                        Đặt làm avatar
                                                    </Button>

                                                    <Button
                                                        danger
                                                        onClick={() => remove(name)}
                                                        icon={<DeleteOutlined />}
                                                    >
                                                        Xóa
                                                    </Button>
                                                </Space>
                                            </Col>
                                        </Row>
                                    </Card>
                                );
                            })}

                            <Form.Item>
                                <Space>
                                    <Button
                                        type="dashed"
                                        onClick={() => add('')}
                                        icon={<PlusOutlined />}
                                    >
                                        Thêm ảnh URL
                                    </Button>

                                    <Upload
                                    showUploadList={false}
                                    multiple
                                    beforeUpload={(file) => {
                                        const selectedFile = file as File;

                                        if (!selectedFile.type.startsWith("image/")) {
                                        message.error("Chỉ được chọn file ảnh");
                                        return false;
                                        }

                                        const isLt5M = selectedFile.size / 1024 / 1024 < 5;
                                        if (!isLt5M) {
                                        message.error("Ảnh phải nhỏ hơn 5MB");
                                        return false;
                                        }

                                        setImageFiles((prev) => [...prev, selectedFile]);
                                        setImagePreviews((prev) => [...prev, URL.createObjectURL(selectedFile)]);

                                        message.success("Đã chọn ảnh chi tiết");
                                        return false;
                                    }}
                                    accept="image/*"
                                    >
                                    <Button icon={<UploadOutlined />}>Upload & Thêm</Button>
                                    </Upload>
                                </Space>
                            </Form.Item>
                        </>
                    )}
                </Form.List>
                    {imagePreviews.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                        <div style={{ marginBottom: 8, fontWeight: 500 }}>
                        Ảnh chi tiết đã chọn
                        </div>

                        <Row gutter={[12, 12]}>
                        {imagePreviews.map((src, index) => (
                            <Col key={src} span={4}>
                            <div style={{ position: "relative" }}>
                                <Image
                                src={src}
                                width={100}
                                height={100}
                                style={{ objectFit: "cover", borderRadius: 6 }}
                                />

                                <Button
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                style={{
                                    position: "absolute",
                                    top: 4,
                                    right: 4,
                                }}
                                onClick={() => {
                                    setImageFiles((prev) => prev.filter((_, i) => i !== index));
                                    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
                                }}
                                />
                            </div>
                            </Col>
                        ))}
                        </Row>
                    </div>
                    )}
                <Card
                    title="Biến thể sản phẩm (Màu sắc, Giá, Số lượng)"
                    style={{ marginTop: 16 }}
                >
                    <Form.List name="items">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Card key={key} size="small" style={{ marginBottom: 12 }}>
                                        <Row gutter={16} align="middle">
                                            <Col span={8}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'color']}
                                                    label="Màu sắc"
                                                    rules={[
                                                        { required: true, message: 'Nhập màu sắc' },
                                                    ]}
                                                >
                                                    <Input placeholder="VD: Đen, Trắng, Xanh..." />
                                                </Form.Item>
                                            </Col>

                                            <Col span={7}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'price']}
                                                    label="Giá"
                                                    rules={[
                                                        { required: true, message: 'Nhập giá' },
                                                        {
                                                            type: 'number',
                                                            min: 0,
                                                            message: 'Giá phải >= 0',
                                                        },
                                                    ]}
                                                >
                                                    <InputNumber
                                                        min={0}
                                                        style={{ width: '100%' }}
                                                        formatter={(value) =>
                                                            `${value}`.replace(
                                                                /\B(?=(\d{3})+(?!\d))/g,
                                                                ','
                                                            )
                                                        }
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col span={7}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'stockQuantity']}
                                                    label="Tồn kho"
                                                    rules={[
                                                        { required: true, message: 'Nhập số lượng' },
                                                        {
                                                            type: 'number',
                                                            min: 0,
                                                            message: 'Số lượng phải >= 0',
                                                        },
                                                    ]}
                                                >
                                                    <InputNumber min={0} style={{ width: '100%' }} />
                                                </Form.Item>
                                            </Col>

                                            <Col span={2}>
                                                {fields.length > 1 && (
                                                    <Button
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => remove(name)}
                                                    />
                                                )}
                                            </Col>
                                        </Row>
                                    </Card>
                                ))}

                                <Form.Item>
                                    <Button
                                        type="dashed"
                                        onClick={() => add({ color: '', price: 0, stockQuantity: 0 })}
                                        block
                                        icon={<PlusOutlined />}
                                    >
                                        Thêm biến thể
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </Card>
            </Form>
        </Modal>
    );
}
