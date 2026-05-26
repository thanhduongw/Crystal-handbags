import { Modal, Form, Input } from 'antd';
import type { CategoryDto } from '../types';
import { useEffect } from 'react';

interface CategoryFormProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: Omit<CategoryDto, 'categoryId'>) => void;
    initialValues?: CategoryDto;
}

export default function CategoryForm({ visible, onCancel, onSubmit, initialValues }: CategoryFormProps) {
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible) {
            if (initialValues) {
                form.setFieldsValue({
                    name: initialValues.name,
                    description: initialValues.description || '',
                    imageUrl: initialValues.imageUrl || '',
                });
            } else {
                form.resetFields();
            }
        }
    }, [visible, initialValues, form]);

    const handleSubmit = () => {
        form.validateFields()
            .then(values => {
                onSubmit(values);
            })
            .catch(() => undefined);
    };

    return (
        <Modal
            open={visible}
            title={initialValues ? 'Sửa danh mục' : 'Thêm danh mục'}
            onCancel={onCancel}
            onOk={handleSubmit}
            okText={initialValues ? 'Cập nhật' : 'Thêm'}
            cancelText="Hủy"
            destroyOnClose
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="name"
                    label="Tên danh mục"
                    rules={[
                        { required: true, message: 'Vui lòng nhập tên danh mục!' },
                        { min: 2, message: 'Tên danh mục phải có ít nhất 2 ký tự!' }
                    ]}
                >
                    <Input placeholder="Nhập tên danh mục" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Mô tả"
                    rules={[
                        { max: 500, message: 'Mô tả không được vượt quá 500 ký tự!' }
                    ]}
                >
                    <Input.TextArea rows={3} placeholder="Nhập mô tả" />
                </Form.Item>

                <Form.Item
                    name="imageUrl"
                    label="URL Hình ảnh"
                    rules={[
                        { type: 'url', message: 'Vui lòng nhập URL hợp lệ!' }
                    ]}
                >
                    <Input placeholder="https://example.com/image.jpg" />
                </Form.Item>
            </Form>
        </Modal>
    );
}
