import { Modal, Form, Input, InputNumber, Select, Upload, Button, Switch, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { CategoryDto } from '../types';
import { fetchCategories } from '../api/categoryAPI';
import { useEffect, useState } from 'react';

interface ProductFormProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (formData: FormData, isEdit: boolean) => void;
    initialValues?: any;
    isEdit?: boolean;
}

export default function ProductForm({ visible, onCancel, onSubmit, initialValues, isEdit = false }: ProductFormProps) {
    const [form] = Form.useForm();
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [loadingCats, setLoadingCats] = useState(false);

    useEffect(() => {
        if (visible) {
            loadCategories();
            if (initialValues) {
                // map server model -> form initial
                const mapped = {
                    ...initialValues,
                    categoryId: initialValues.categoryId ?? initialValues.category?.categoryId,
                    showHomepage: !!initialValues.showHomepage,
                };
                form.setFieldsValue(mapped);
            } else {
                form.resetFields();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, initialValues]);

    const loadCategories = async () => {
        try {
            setLoadingCats(true);
            const data = await fetchCategories();
            setCategories(data);
        } catch {
            message.error('Không tải được danh mục');
        } finally {
            setLoadingCats(false);
        }
    };

    const handleFinish = (values: any) => {
        const fd = new FormData();
        fd.append('name', values.name ?? '');
        fd.append('description', values.description ?? '');
        fd.append('basePrice', String(values.basePrice ?? 0));
        fd.append('categoryId', String(values.categoryId ?? ''));
        fd.append('showHomepage', String(Boolean(values.showHomepage)));

        if (values.images && Array.isArray(values.images)) {
            values.images.forEach((file: any) => {
                const f = file.originFileObj ?? file;
                if (f) fd.append('images', f);
            });
        }

        onSubmit(fd, isEdit);
    };

    return (
        <Modal
            visible={visible}
            title={isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
            onCancel={onCancel}
            onOk={() => form.submit()}
            width={800}
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={handleFinish}>
                <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true, message: 'Nhập tên' }]}>
                    <Input />
                </Form.Item>

                <Form.Item name="description" label="Mô tả" rules={[{ required: true, message: 'Nhập mô tả' }]}>
                    <Input.TextArea rows={4} />
                </Form.Item>

                <Form.Item name="basePrice" label="Giá" rules={[{ required: true, message: 'Nhập giá' }]}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true, message: 'Chọn danh mục' }]}>
                    <Select loading={loadingCats} placeholder="Chọn danh mục">
                        {categories.map((c) => (
                            <Select.Option key={c.categoryId} value={c.categoryId}>
                                {c.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item name="images" label="Hình ảnh" valuePropName="fileList" getValueFromEvent={(e) => e?.fileList}>
                    <Upload listType="picture" maxCount={5} multiple beforeUpload={() => false}>
                        <Button icon={<UploadOutlined />}>Chọn hình</Button>
                    </Upload>
                </Form.Item>

                <Form.Item name="showHomepage" label="Hiển thị trang chủ" valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Form>
        </Modal>
    );
}
