import { Result, Button } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

export default function PaymentResult() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const responseCode = params.get('responseCode');
  const txnRef = params.get('txnRef');

  const success = responseCode === '00';

  return (
    <Result
      status={success ? 'success' : 'error'}
      title={success ? 'Thanh toán thành công' : 'Thanh toán thất bại'}
      subTitle={txnRef ? `Mã giao dịch: ${txnRef}` : undefined}
      extra={[
        <Button type="primary" key="orders" onClick={() => navigate('/orders')}>
          Xem đơn hàng
        </Button>,
        <Button key="home" onClick={() => navigate('/')}>
          Về trang chủ
        </Button>,
      ]}
    />
  );
}