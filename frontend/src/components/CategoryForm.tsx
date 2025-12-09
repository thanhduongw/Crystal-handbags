import { Modal, Form, Input } from 'antd';
import type { CategoryDto } from '../types';
import { useEffect } from 'react';

interface CategoryFormProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: any) => void;
    initialValues?: CategoryDto;
}

export default function CategoryForm({ visible, onCancel, onSubmit, initialValues }: CategoryFormProps) {
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible) {
            if (initialValues) {
                form.setFieldsValue(initialValues);
            } else {
                form.resetFields();
            }
        }
    }, [visible, initialValues]);

    const handleSubmit = () => {
        form.submit();
    };

    return (
        <Modal
            visible={visible}
            title={initialValues ? 'Sửa danh mục' : 'Thêm danh mục'}
            onCancel={onCancel}
            onOk={handleSubmit}
        >
            <Form form={form} onFinish={onSubmit} layout="vertical">
                <Form.Item name="name" label="Tên danh mục" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="description" label="Mô tả">
                    <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item name="imageUrl" label="URL Hình ảnh">
                    <Input />
                </Form.Item>
            </Form>
        </Modal>
    );
}