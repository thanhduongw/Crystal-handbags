import { useState, useEffect, useCallback } from 'react';
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

const BASE_PROVINCE_API = 'https://provinces.open-api.vn/api/v1';

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

    const loadAddresses = useCallback(async () => {
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
    }, []);

    const loadProvinces = useCallback(async () => {
        try {
            setLoadingProvinces(true);
            const cached = localStorage.getItem('provinces_list_v1');
            if (cached) {
                setProvinces(JSON.parse(cached));
                setLoadingProvinces(false);
                return;
            }

            const resp = await axios.get(`${BASE_PROVINCE_API}/`);
            const list = Array.isArray(resp.data) ? resp.data : resp.data?.results || [];
            const opts = list.map((p: any) => ({ value: String(p.code ?? p.province_id ?? p.id ?? p.code), label: p.name ?? p.province_name ?? p.province }));
            setProvinces(opts);
            try { localStorage.setItem('provinces_list_v1', JSON.stringify(opts)); } catch { /* ignore */ }
        } catch (err) {
            console.error('Load provinces error', err);
            message.error('Không thể tải danh sách tỉnh/thành (API đơn vị hành chính).');
        } finally {
            setLoadingProvinces(false);
        }
    }, []);

    const loadDistricts = useCallback(async (provinceCode: string | number) => {
        if (!provinceCode) return setDistricts([]);
        try {
            setLoadingDistricts(true);
            setDistricts([]);
            setWards([]);
            const resp = await axios.get(`${BASE_PROVINCE_API}/p/${provinceCode}?depth=2`);
            const districtsData = resp?.data?.districts ?? resp?.data ?? [];
            const opts = (Array.isArray(districtsData) ? districtsData : []).map((d: any) => ({
                value: String(d.code ?? d.district_id ?? d.id),
                label: d.name ?? d.district_name ?? d.district,
            }));
            setDistricts(opts);
        } catch (err) {
            console.error('Load districts error', err);
            try {
                const resp2 = await axios.get(`${BASE_PROVINCE_API}/?depth=2`);
                const provList = Array.isArray(resp2.data) ? resp2.data : resp2.data?.results ?? [];
                const found = provList.find((p: any) => String(p.code) === String(provinceCode) || String(p.province_id) === String(provinceCode));
                const ds = found?.districts ?? [];
                const opts = (ds || []).map((d: any) => ({ value: String(d.code ?? d.district_id), label: d.name ?? d.district_name }));
                setDistricts(opts);
            } catch (e) {
                message.error('Không thể tải danh sách quận/huyện!');
            }
        } finally {
            setLoadingDistricts(false);
        }
    }, []);

    const loadWards = useCallback(async (districtCode: string | number) => {
        if (!districtCode) return setWards([]);
        try {
            setLoadingWards(true);
            setWards([]);
            const resp = await axios.get(`${BASE_PROVINCE_API}/d/${districtCode}?depth=2`);
            const wardsData = resp?.data?.wards ?? resp?.data ?? [];
            const opts = (Array.isArray(wardsData) ? wardsData : []).map((w: any) => ({
                value: String(w.code ?? w.ward_id ?? w.id),
                label: w.name ?? w.ward_name ?? w.ward,
            }));
            setWards(opts);
        } catch (err) {
            console.error('Load wards error', err);
            try {
                const resp2 = await axios.get(`${BASE_PROVINCE_API}/?depth=3`);
                const provList = Array.isArray(resp2.data) ? resp2.data : resp2.data?.results ?? [];
                let foundWards: any[] = [];
                for (const p of provList) {
                    for (const d of (p.districts || [])) {
                        if (String(d.code) === String(districtCode) || String(d.district_id) === String(districtCode)) {
                            foundWards = d.wards || [];
                            break;
                        }
                    }
                    if (foundWards.length) break;
                }
                const opts = (foundWards || []).map((w: any) => ({ value: String(w.code ?? w.ward_id), label: w.name ?? w.ward_name }));
                setWards(opts);
            } catch (e) {
                message.error('Không thể tải danh sách phường/xã!');
            }
        } finally {
            setLoadingWards(false);
        }
    }, []);

    const openEditModal = async (addr: Address | null) => {
        setEditingAddress(addr);
        form.resetFields();
        setDistricts([]);
        setWards([]);

        if (!addr) {
            setModalVisible(true);
            return;
        }

        const prov = provinces.find(p => p.label === addr.province);
        if (prov) {
            form.setFieldsValue({ province: prov.value });
            await loadDistricts(prov.value);
            const dist = (districts.length ? districts.find(d => d.label === addr.district) : null)
                || (await (async () => districts.find(d => d.label === addr.district))());
            if (!dist) {
                try {
                    const resp = await axios.get(`${BASE_PROVINCE_API}/p/${prov.value}?depth=2`);
                    const ds = resp?.data?.districts ?? resp?.data ?? [];
                    const found = (ds || []).find((d: any) => (d.name ?? d.district_name) === addr.district);
                    if (found) {
                        const distCode = String(found.code ?? found.district_id);
                        await loadDistricts(prov.value);
                        form.setFieldsValue({ district: distCode });
                        await loadWards(distCode);
                        const wardFound = (found.wards || []).find((w: any) => (w.name ?? w.ward_name) === addr.ward);
                        if (wardFound) {
                            form.setFieldsValue({ ward: String(wardFound.code ?? wardFound.ward_id) });
                        }
                    }
                } catch (e) {
                    // ignore
                }
            } else {
                form.setFieldsValue({ district: dist.value });
                await loadWards(dist.value);
                const w = wards.find(w => w.label === addr.ward);
                if (w) form.setFieldsValue({ ward: w.value });
            }
        } else {
            form.setFieldsValue({
                fullName: addr.fullName,
                phoneNumber: addr.phoneNumber,
                street: addr.street,
            });
        }

        form.setFieldsValue({
            fullName: addr.fullName,
            phoneNumber: addr.phoneNumber,
            street: addr.street,
        });

        setModalVisible(true);
    };

    const handleSubmit = async (values: any) => {
        const provinceLabel = provinces.find(p => p.value === values.province)?.label;
        const districtLabel = districts.find(d => d.value === values.district)?.label;
        const wardLabel = wards.find(w => w.value === values.ward)?.label;

        const payload = {
            fullName: values.fullName,
            phoneNumber: values.phoneNumber,
            province: provinceLabel ?? values.province,
            district: districtLabel ?? values.district,
            ward: wardLabel ?? values.ward,
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

    useEffect(() => { loadAddresses(); }, [loadAddresses]);
    useEffect(() => { loadProvinces(); }, [loadProvinces]);

    const onProvinceChange = async (val: string) => {
        form.setFieldsValue({ district: undefined, ward: undefined });
        await loadDistricts(val);
    };

    const onDistrictChange = async (val: string) => {
        form.setFieldsValue({ ward: undefined });
        await loadWards(val);
    };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
            {fromCheckout && (
                <Button style={{ marginBottom: 16 }} onClick={() => navigate(-1)}>
                    ⬅ Quay lại Thanh toán
                </Button>
            )}

            <Card
                title="Địa chỉ của tôi"
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openEditModal(null)}>Thêm địa chỉ mới</Button>}
            >
                {loading ? (
                    <Spin />
                ) : addresses.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {addresses.map(addr => (
                            <Card
                                key={addr.addressId}
                                size="small"
                                hoverable
                                style={{
                                    borderLeft: addr.isDefault ? '4px solid #1890ff' : '4px solid transparent',
                                    transition: 'all 0.3s',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ marginBottom: 8 }}>
                                            <HomeOutlined style={{ marginRight: 8, fontSize: 18, color: '#1890ff' }} />
                                            <span style={{ fontWeight: 600, fontSize: 16 }}>{addr.fullName}</span>
                                            <span style={{ marginLeft: 12, color: '#666' }}>({addr.phoneNumber})</span>
                                            {addr.isDefault && <Tag color="blue" style={{ marginLeft: 12 }}>Mặc định</Tag>}
                                        </div>
                                        <div style={{ color: '#666', fontSize: 14 }}>
                                            {addr.street}, {addr.ward}, {addr.district}, {addr.province}
                                        </div>
                                    </div>
                                    <Space>
                                        {!addr.isDefault && (
                                            <Button size="small" onClick={() => handleSetDefault(addr.addressId)}>
                                                Đặt làm mặc định
                                            </Button>
                                        )}
                                        <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(addr)} />
                                        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(addr.addressId)} />
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
                onCancel={() => { setModalVisible(false); form.resetFields(); }}
                onOk={() => form.submit()}
                width={700}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{}}>
                    <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>

                    <Form.Item name="phoneNumber" label="Số điện thoại" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>

                    <Form.Item name="province" label="Tỉnh/Thành phố" rules={[{ required: true }]}>
                        {loadingProvinces ? <Spin /> : <Select options={provinces} showSearch filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} onChange={onProvinceChange} />}
                    </Form.Item>

                    <Form.Item name="district" label="Quận/Huyện" rules={[{ required: true }]}>
                        {loadingDistricts ? <Spin /> : <Select options={districts} disabled={districts.length === 0} showSearch filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} onChange={onDistrictChange} />}
                    </Form.Item>

                    <Form.Item name="ward" label="Phường/Xã" rules={[{ required: true }]}>
                        {loadingWards ? <Spin /> : <Select options={wards} disabled={wards.length === 0} showSearch filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} />}
                    </Form.Item>

                    <Form.Item name="street" label="Địa chỉ chi tiết (đường, số nhà,...)" rules={[{ required: true }]}>
                        <Input.TextArea rows={2} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}