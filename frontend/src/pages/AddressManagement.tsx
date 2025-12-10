import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Card, Button, Modal, Form, Input, Select, message, Tag, Space, Spin, Empty
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, HomeOutlined
} from '@ant-design/icons';
import instance from '../api/axiosInstance';
import axios from 'axios';

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

type Option = { value: string; label: string };

const BASE_PROVINCE_API = 'https://provinces.open-api.vn/api';

export default function AddressManagement() {
    const navigate = useNavigate();
    const location = useLocation();
    const fromCheckout = location.state?.fromCheckout;

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [form] = Form.useForm();

    const [provinces, setProvinces] = useState<Option[]>([]);
    const [districts, setDistricts] = useState<Option[]>([]);
    const [wards, setWards] = useState<Option[]>([]);

    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingWards, setLoadingWards] = useState(false);

    useEffect(() => {
        loadAddresses();
        loadProvinces();
    }, []);

    const loadAddresses = async () => {
        try {
            setLoading(true);
            const resp = await instance.get('/addresses');
            setAddresses(resp.data || []);
        } catch (err) {
            console.error('Load addresses error', err);
            message.error('Không thể tải danh sách địa chỉ!');
        } finally {
            setLoading(false);
        }
    };

    const loadProvinces = async () => {
        try {
            setLoadingProvinces(true);
            const resp = await axios.get(`${BASE_PROVINCE_API}/p/`);
            const list = resp.data || [];
            const opts = list.map((p: any) => ({
                value: String(p.code),
                label: p.name
            }));
            setProvinces(opts);
        } catch (err) {
            console.error('Load provinces error', err);
            message.error('Không thể tải danh sách tỉnh/thành!');
        } finally {
            setLoadingProvinces(false);
        }
    };

    const loadDistricts = async (provinceCode: string) => {
        if (!provinceCode) {
            setDistricts([]);
            setWards([]);
            return;
        }

        try {
            setLoadingDistricts(true);
            setDistricts([]);
            setWards([]);

            const resp = await axios.get(`${BASE_PROVINCE_API}/p/${provinceCode}?depth=2`);
            const districtsData = resp.data?.districts || [];
            const opts = districtsData.map((d: any) => ({
                value: String(d.code),
                label: d.name
            }));
            setDistricts(opts);
        } catch (err) {
            console.error('Load districts error', err);
            message.error('Không thể tải danh sách quận/huyện!');
        } finally {
            setLoadingDistricts(false);
        }
    };

    const loadWards = async (districtCode: string) => {
        if (!districtCode) {
            setWards([]);
            return;
        }

        try {
            setLoadingWards(true);
            setWards([]);

            const resp = await axios.get(`${BASE_PROVINCE_API}/d/${districtCode}?depth=2`);
            const wardsData = resp.data?.wards || [];
            const opts = wardsData.map((w: any) => ({
                value: String(w.code),
                label: w.name
            }));
            setWards(opts);
        } catch (err) {
            console.error('Load wards error', err);
            message.error('Không thể tải danh sách phường/xã!');
        } finally {
            setLoadingWards(false);
        }
    };

    const openModal = (addr: Address | null = null) => {
        setEditingAddress(addr);
        form.resetFields();
        setDistricts([]);
        setWards([]);

        if (addr) {
            // Find province code by name
            const prov = provinces.find(p => p.label === addr.province);
            if (prov) {
                form.setFieldsValue({
                    fullName: addr.fullName,
                    phoneNumber: addr.phoneNumber,
                    province: prov.value,
                    street: addr.street,
                });
                // Load districts and wards
                loadDistricts(prov.value).then(() => {
                    const dist = districts.find(d => d.label === addr.district);
                    if (dist) {
                        form.setFieldsValue({ district: dist.value });
                        loadWards(dist.value).then(() => {
                            const w = wards.find(w => w.label === addr.ward);
                            if (w) form.setFieldsValue({ ward: w.value });
                        });
                    }
                });
            }
        }

        setModalVisible(true);
    };

    const handleSubmit = async (values: any) => {
        const provinceLabel = provinces.find(p => p.value === values.province)?.label || values.province;
        const districtLabel = districts.find(d => d.value === values.district)?.label || values.district;
        const wardLabel = wards.find(w => w.value === values.ward)?.label || values.ward;

        const payload = {
            fullName: values.fullName,
            phoneNumber: values.phoneNumber,
            province: provinceLabel,
            district: districtLabel,
            ward: wardLabel,
            street: values.street,
        };

        try {
            if (editingAddress) {
                await instance.put(`/addresses/${editingAddress.addressId}`, payload);
                message.success('Cập nhật thành công!');
            } else {
                await instance.post('/addresses', payload);
                message.success('Thêm địa chỉ thành công!');
            }
            setModalVisible(false);
            form.resetFields();
            loadAddresses();
        } catch (err) {
            console.error('Save address error', err);
            message.error('Thao tác thất bại!');
        }
    };

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: 'Xác nhận xóa địa chỉ?',
            content: 'Không thể hoàn tác!',
            okText: 'Xóa',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            async onOk() {
                try {
                    await instance.delete(`/addresses/${id}`);
                    message.success('Xóa thành công!');
                    loadAddresses();
                } catch (err) {
                    console.error('Delete error', err);
                    message.error('Xóa thất bại!');
                }
            }
        });
    };

    const handleSetDefault = async (id: number) => {
        try {
            await instance.put(`/addresses/${id}/default`);
            message.success('Đã đặt làm mặc định!');
            loadAddresses();
        } catch (err) {
            console.error('Set default error', err);
            message.error('Thao tác thất bại!');
        }
    };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
            {fromCheckout && (
                <Button
                    style={{ marginBottom: 16 }}
                    onClick={() => navigate(-1)}
                >
                    ← Quay lại Thanh toán
                </Button>
            )}

            <Card
                title="Địa chỉ của tôi"
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => openModal()}
                    >
                        Thêm địa chỉ mới
                    </Button>
                }
            >
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '48px 0' }}>
                        <Spin />
                    </div>
                ) : addresses.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {addresses.map(addr => (
                            <Card
                                key={addr.addressId}
                                size="small"
                                hoverable
                                style={{
                                    borderLeft: addr.isDefault
                                        ? '4px solid #1890ff'
                                        : '4px solid transparent',
                                    transition: 'all 0.3s',
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    gap: 16,
                                    flexWrap: 'wrap'
                                }}>
                                    <div style={{ flex: 1, minWidth: 200 }}>
                                        <div style={{ marginBottom: 8 }}>
                                            <HomeOutlined style={{
                                                marginRight: 8,
                                                fontSize: 18,
                                                color: '#1890ff'
                                            }} />
                                            <span style={{ fontWeight: 600, fontSize: 16 }}>
                                                {addr.fullName}
                                            </span>
                                            <span style={{ marginLeft: 12, color: '#666' }}>
                                                ({addr.phoneNumber})
                                            </span>
                                            {addr.isDefault && (
                                                <Tag color="blue" style={{ marginLeft: 12 }}>
                                                    Mặc định
                                                </Tag>
                                            )}
                                        </div>
                                        <div style={{ color: '#666', fontSize: 14 }}>
                                            {addr.street}, {addr.ward}, {addr.district}, {addr.province}
                                        </div>
                                    </div>
                                    <Space wrap>
                                        {!addr.isDefault && (
                                            <Button
                                                size="small"
                                                onClick={() => handleSetDefault(addr.addressId)}
                                            >
                                                Đặt làm mặc định
                                            </Button>
                                        )}
                                        <Button
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={() => openModal(addr)}
                                        />
                                        <Button
                                            size="small"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => handleDelete(addr.addressId)}
                                        />
                                    </Space>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Empty description="Chưa có địa chỉ nào" />
                )}
            </Card>

            <Modal
                open={modalVisible}
                title={editingAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                width={700}
                okText={editingAddress ? 'Cập nhật' : 'Thêm'}
                cancelText="Hủy"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="fullName"
                        label="Họ và tên"
                        rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                    >
                        <Input placeholder="Nguyễn Văn A" />
                    </Form.Item>

                    <Form.Item
                        name="phoneNumber"
                        label="Số điện thoại"
                        rules={[
                            { required: true, message: 'Vui lòng nhập số điện thoại!' },
                            { pattern: /^[0-9]{10}$/, message: 'Số điện thoại không hợp lệ!' }
                        ]}
                    >
                        <Input placeholder="0369384679" />
                    </Form.Item>

                    <Form.Item
                        name="province"
                        label="Tỉnh/Thành phố"
                        rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành!' }]}
                    >
                        {loadingProvinces ? (
                            <Spin />
                        ) : (
                            <Select
                                options={provinces}
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                onChange={(value) => {
                                    form.setFieldsValue({ district: undefined, ward: undefined });
                                    loadDistricts(value);
                                }}
                                placeholder="Chọn tỉnh/thành phố"
                            />
                        )}
                    </Form.Item>

                    <Form.Item
                        name="district"
                        label="Quận/Huyện"
                        rules={[{ required: true, message: 'Vui lòng chọn quận/huyện!' }]}
                    >
                        {loadingDistricts ? (
                            <Spin />
                        ) : (
                            <Select
                                options={districts}
                                disabled={districts.length === 0}
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                onChange={(value) => {
                                    form.setFieldsValue({ ward: undefined });
                                    loadWards(value);
                                }}
                                placeholder="Chọn quận/huyện"
                            />
                        )}
                    </Form.Item>

                    <Form.Item
                        name="ward"
                        label="Phường/Xã"
                        rules={[{ required: true, message: 'Vui lòng chọn phường/xã!' }]}
                    >
                        {loadingWards ? (
                            <Spin />
                        ) : (
                            <Select
                                options={wards}
                                disabled={wards.length === 0}
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                placeholder="Chọn phường/xã"
                            />
                        )}
                    </Form.Item>

                    <Form.Item
                        name="street"
                        label="Địa chỉ chi tiết (đường, số nhà,...)"
                        rules={[{ required: true, message: 'Vui lòng nhập địa chỉ chi tiết!' }]}
                    >
                        <Input.TextArea
                            rows={2}
                            placeholder="Số nhà, tên đường..."
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}