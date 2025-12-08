import { Modal, Form, Input, InputNumber, Select, Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { Category } from '../types';
import { fetchCategories } from '../api/categoryAPI';
import { useEffect, useState } from 'react';

interface ProductFormProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: any) => void;
    initialValues?: any;
}

export default function ProductForm({ visible, onCancel, onSubmit, initialValues }: ProductFormProps) {
    const [form] = Form.useForm();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            loadCategories();
            if (initialValues) {
                form.setFieldsValue(initialValues);
            } else {
                form.resetFields();
            }
        }
    }, [visible, initialValues]);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await fetchCategories();
            setCategories(data);
        } catch (error) {
            message.error('Không thể tải danh mục!');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = () => {
        form.submit();
    };

    return (
        <Modal
            visible={visible}
            title={initialValues ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
            onCancel={onCancel}
            onOk={handleSubmit}
            width={800}
        >
            <Form form={form} onFinish={onSubmit} layout="vertical">
                <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>

                <Form.Item name="description" label="Mô tả" rules={[{ required: true }]}>
                    <Input.TextArea rows={4} />
                </Form.Item>

                <Form.Item name="basePrice" label="Giá" rules={[{ required: true }]}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item name="categoryName" label="Danh mục" rules={[{ required: true }]}>
                    <Select loading={loading}>
                        {categories.map((cat) => (
                            <Select.Option key={cat.id} value={cat.name}>
                                {cat.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item name="images" label="Hình ảnh" valuePropName="fileList" getValueFromEvent={(e) => e?.fileList}>
                    <Upload listType="picture" maxCount={5} multiple beforeUpload={() => false}>
                        <Button icon={<UploadOutlined />}>Chọn hình ảnh</Button>
                    </Upload>
                </Form.Item>

                <Form.Item name="showHomepage" label="Hiển thị trang chủ" valuePropName="checked">
                    <Input type="checkbox" />
                </Form.Item>
            </Form>
        </Modal>
    );
}