import { useState, useEffect } from 'react';
import { Card, Button, List, Modal, Form, Input, message, Tag, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, HomeOutlined } from '@ant-design/icons';
import instance from '../api/axiosInstance';

interface Address {
    addressId: number;
    fullName: string;
    phoneNumber: string;
    province: string;
    district: string;
    ward: string;
    street: string;
    isDefault: boolean;
}

export default function AddressManagement() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [form] = Form.useForm();

    useEffect(() => {
        loadAddresses();
    }, []);

    const loadAddresses = async () => {
        try {
            setLoading(true);
            const response = await instance.get('/addresses');
            setAddresses(response.data);
        } catch (error) {
            message.error('Không thể tải danh sách địa chỉ!');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            if (editingAddress) {
                await instance.put(`/addresses/${editingAddress.addressId}`, values);
                message.success('Cập nhật địa chỉ thành công!');
            } else {
                await instance.post('/addresses', values);
                message.success('Thêm địa chỉ thành công!');
            }
            setModalVisible(false);
            form.resetFields();
            loadAddresses();
        } catch (error) {
            message.error('Thao tác thất bại!');
        }
    };

    const handleDelete = async (id: number) => {
        Modal.confirm({
            title: 'Xác nhận xóa địa chỉ?',
            content: 'Bạn không thể hoàn tác sau khi xóa.',
            async onOk() {
                try {
                    await instance.delete(`/addresses/${id}`);
                    message.success('Xóa địa chỉ thành công!');
                    loadAddresses();
                } catch (error) {
                    message.error('Xóa thất bại!');
                }
            },
        });
    };

    const handleSetDefault = async (id: number) => {
        try {
            await instance.put(`/addresses/${id}/default`);
            message.success('Đã đặt làm địa chỉ mặc định!');
            loadAddresses();
        } catch (error) {
            message.error('Thao tác thất bại!');
        }
    };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
            <Card
                title="Địa chỉ của tôi"
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setEditingAddress(null);
                            form.resetFields();
                            setModalVisible(true);
                        }}
                    >
                        Thêm địa chỉ mới
                    </Button>
                }
            >
                <List
                    loading={loading}
                    dataSource={addresses}
                    renderItem={(addr) => (
                        <List.Item
                            actions={[
                                !addr.isDefault && (
                                    <Button
                                        size="small"
                                        onClick={() => handleSetDefault(addr.addressId)}
                                    >
                                        Đặt làm mặc định
                                    </Button>
                                ),
                                <Button
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={() => {
                                        setEditingAddress(addr);
                                        form.setFieldsValue(addr);
                                        setModalVisible(true);
                                    }}
                                />,
                                <Button
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDelete(addr.addressId)}
                                />,
                            ]}
                        >
                            <List.Item.Meta
                                avatar={<HomeOutlined style={{ fontSize: 24 }} />}
                                title={
                                    <Space>
                                        {addr.fullName} - {addr.phoneNumber}
                                        {addr.isDefault && <Tag color="blue">Mặc định</Tag>}
                                    </Space>
                                }
                                description={`${addr.street}, ${addr.ward}, ${addr.district}, ${addr.province}`}
                            />
                        </List.Item>
                    )}
                />
            </Card>

            <Modal
                open={modalVisible}
                title={editingAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="phoneNumber" label="Số điện thoại" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="province" label="Tỉnh/Thành phố" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="district" label="Quận/Huyện" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="ward" label="Phường/Xã" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="street" label="Địa chỉ cụ thể" rules={[{ required: true }]}>
                        <Input.TextArea rows={2} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}