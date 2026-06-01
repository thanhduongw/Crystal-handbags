import { useEffect, useState } from 'react';
import { Modal, Form, Input, Upload, Button, Image, Space, message } from 'antd';
import { DeleteOutlined, PictureOutlined, UploadOutlined } from '@ant-design/icons';
import type { CategoryDto, CategoryFormFiles } from '../types';

interface CategoryFormProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (
        values: Omit<CategoryDto, 'categoryId'>,
        files?: CategoryFormFiles
    ) => void;
    initialValues?: CategoryDto;
    submitting?: boolean;
}

export default function CategoryForm({
    visible,
    onCancel,
    onSubmit,
    initialValues,
    submitting = false,
}: CategoryFormProps) {
    const [form] = Form.useForm();
    const [imageFile, setImageFile] = useState<File>();
    const [imagePreview, setImagePreview] = useState<string>();
    const [deleteImageRequested, setDeleteImageRequested] = useState(false);

    useEffect(() => {
        return () => {
            if (imagePreview?.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const resetFormState = () => {
        if (imagePreview?.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview);
        }

        setImageFile(undefined);
        setDeleteImageRequested(false);

        if (initialValues) {
            form.setFieldsValue({
                name: initialValues.name,
                description: initialValues.description || '',
            });

            setImagePreview(initialValues.imageUrl || undefined);
        } else {
            form.resetFields();
            setImagePreview(undefined);
        }
    };

    const handleSelectImage = (file: File) => {
        if (!file.type.startsWith('image/')) {
            message.error('Chỉ được chọn file ảnh');
            return false;
        }

        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error('Ảnh phải nhỏ hơn 5MB');
            return false;
        }

        if (imagePreview?.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview);
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setDeleteImageRequested(false);

        // Chặn Ant Design upload tự động.
        // Chỉ preview, bấm Thêm/Cập nhật mới upload lên S3.
        return false;
    };

    const applyRemoveImage = () => {
        if (imagePreview?.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview);
        }

        setImageFile(undefined);
        setImagePreview(undefined);

        // Nếu category cũ đang có ảnh thì đánh dấu xóa.
        // Bấm Cập nhật mới gọi API xóa ảnh trên S3.
        setDeleteImageRequested(!!initialValues?.imageUrl);
    };

    const handleRemoveImage = () => {
        Modal.confirm({
            title: 'Xóa ảnh danh mục?',
            content: 'Ảnh chỉ bị xóa thật sự khi bạn bấm Cập nhật.',
            okText: 'Xóa ảnh',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            onOk: applyRemoveImage,
        });
    };

    const handleSubmit = () => {
        form.validateFields()
            .then(values => {
                onSubmit(
                    {
                        name: values.name,
                        description: values.description,
                        imageUrl: initialValues?.imageUrl,
                    },
                    {
                        imageFile,
                        deleteImage: deleteImageRequested,
                    }
                );
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
            destroyOnHidden
            confirmLoading={submitting}
            afterOpenChange={(open) => {
                if (open) {
                    resetFormState();
                }
            }}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="name"
                    label="Tên danh mục"
                    rules={[
                        { required: true, message: 'Vui lòng nhập tên danh mục!' },
                        { min: 2, message: 'Tên danh mục phải có ít nhất 2 ký tự!' },
                    ]}
                >
                    <Input placeholder="Nhập tên danh mục" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Mô tả"
                    rules={[
                        { max: 500, message: 'Mô tả không được vượt quá 500 ký tự!' },
                    ]}
                >
                    <Input.TextArea rows={3} placeholder="Nhập mô tả" />
                </Form.Item>

                <Form.Item label="Ảnh danh mục">
                    <Space direction="vertical" style={{ width: '100%' }}>
                        {imagePreview ? (
                            <Image
                                src={imagePreview}
                                width={140}
                                height={140}
                                style={{
                                    objectFit: 'cover',
                                    borderRadius: 8,
                                }}
                                fallback="https://placehold.co/140x140?text=Error"
                            />
                        ) : (
                            <div
                                style={{
                                    width: 140,
                                    height: 140,
                                    borderRadius: 8,
                                    background: '#f5f5f5',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <PictureOutlined
                                    style={{
                                        fontSize: 28,
                                        color: '#999',
                                    }}
                                />
                            </div>
                        )}

                        <Space>
                            <Upload
                                showUploadList={false}
                                accept="image/*"
                                beforeUpload={handleSelectImage}
                            >
                                <Button icon={<UploadOutlined />}>
                                    Chọn ảnh
                                </Button>
                            </Upload>

                            {imagePreview && (
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={handleRemoveImage}
                                >
                                    Xóa ảnh
                                </Button>
                            )}
                        </Space>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
}
