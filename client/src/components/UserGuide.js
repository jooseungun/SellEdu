import React, { useState } from 'react';
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import HelpIcon from '@mui/icons-material/Help';
import CloseIcon from '@mui/icons-material/Close';
import { getUserFromToken } from '../utils/auth';

const UserGuide = () => {
  const [open, setOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const user = getUserFromToken();
  const userRoles = user?.roles || (user?.role ? [user?.role] : []);
  
  // 기본 탭 결정: 사용자 역할에 따라
  React.useEffect(() => {
    if (userRoles.includes('admin')) {
      setTabValue(2);
    } else if (userRoles.includes('seller')) {
      setTabValue(1);
    } else {
      setTabValue(0);
    }
  }, [userRoles]);

  const accountInfo = {
    buyer: { id: 'joosu14', password: 'joosu14' },
    seller: { id: 'jooss', password: 'jooss1' },
    admin: { id: '로그인 페이지 참조', password: '로그인 페이지 참조' }
  };

  const buyerGuide = [
    {
      title: '콘텐츠 탐색',
      items: [
        '메인 페이지에서 카테고리별로 콘텐츠를 탐색할 수 있습니다.',
        '검색창을 사용하여 원하는 콘텐츠를 검색할 수 있습니다.',
        '콘텐츠 카드를 클릭하면 상세 정보를 확인할 수 있습니다.'
      ]
    },
    {
      title: '콘텐츠 구매',
      items: [
        '콘텐츠 상세 페이지에서 "구매하기" 버튼을 클릭합니다.',
        '결제 다이얼로그에서 "결제완료" 버튼을 클릭합니다.',
        '구매 완료 후 "내 구매 내역" 탭에서 확인할 수 있습니다.'
      ]
    },
    {
      title: '장바구니',
      items: [
        '여러 콘텐츠를 장바구니에 추가할 수 있습니다.',
        '장바구니 아이콘을 클릭하여 장바구니를 확인합니다.',
        '장바구니에서 일괄 구매가 가능합니다.'
      ]
    },
    {
      title: '구매 내역 및 후기',
      items: [
        '"내 구매 내역" 탭에서 구매한 콘텐츠를 확인할 수 있습니다.',
        '구매한 콘텐츠에 대해 후기와 평점을 작성할 수 있습니다.',
        '후기는 구매 내역에서만 작성 가능합니다.'
      ]
    },
    {
      title: '제휴할인',
      items: [
        '맑은소프트 이용고객은 30% 할인을 받을 수 있습니다.',
        '제휴할인 신청 후 관리자 승인 시 할인이 적용됩니다.'
      ]
    },
    {
      title: '프로필 관리',
      items: [
        '우측 상단 설정 아이콘을 클릭하여 프로필을 수정할 수 있습니다.',
        '비밀번호 변경이 가능합니다.',
        '아이디(사용자명)는 변경할 수 없습니다.'
      ]
    }
  ];

  const sellerGuide = [
    {
      title: '콘텐츠 등록',
      items: [
        '"콘텐츠 등록" 버튼을 클릭하여 새 콘텐츠를 등록합니다.',
        '제목, 설명, 상세 설명, 가격, 카테고리 등을 입력합니다.',
        '썸네일 이미지를 업로드할 수 있습니다.',
        '콘텐츠 구성(차시)을 추가하여 강의 내용을 구성합니다.',
        '판매 기간을 설정할 수 있습니다.'
      ]
    },
    {
      title: '콘텐츠 관리',
      items: [
        '"내 콘텐츠 현황" 탭에서 등록한 콘텐츠를 확인합니다.',
        '승인된 콘텐츠는 "수정/재등록" 버튼으로 수정할 수 있습니다.',
        '거부된 콘텐츠는 거부 사유를 확인하고 수정 후 재등록할 수 있습니다.',
        '수정 시 모든 필드를 변경할 수 있습니다.'
      ]
    },
    {
      title: '판매 현황',
      items: [
        '"판매 현황" 탭에서 총 판매 콘텐츠 수와 총 판매액을 확인합니다.',
        '각 콘텐츠별 판매 금액이 집계되어 표시됩니다.'
      ]
    },
    {
      title: '판매 내역',
      items: [
        '"판매 내역" 탭에서 구매자별 판매 내역을 확인합니다.',
        '주문번호, 구매자 정보, 판매 금액, 판매일을 확인할 수 있습니다.'
      ]
    },
    {
      title: '후기 관리',
      items: [
        '"후기 관리" 탭에서 구매자들이 작성한 후기를 확인합니다.',
        '콘텐츠별, 구매자별로 후기와 평점을 확인할 수 있습니다.'
      ]
    },
    {
      title: '제휴할인',
      items: [
        '맑은소프트 제휴할인을 신청할 수 있습니다.',
        '신청 후 관리자 승인 시 할인이 적용됩니다.'
      ]
    }
  ];

  const adminGuide = [
    {
      title: '콘텐츠 승인 검토',
      items: [
        '"콘텐츠 승인 검토" 탭에서 판매자가 신청한 콘텐츠를 검토합니다.',
        '콘텐츠 상세 정보를 확인하고 승인 또는 거부할 수 있습니다.',
        '거부 시 거부 사유를 입력해야 합니다.'
      ]
    },
    {
      title: '상품관리',
      items: [
        '"상품관리" 탭에서 모든 콘텐츠를 관리합니다.',
        '과정명을 클릭하면 상세 정보를 확인하고 수정할 수 있습니다.',
        '썸네일을 변경할 수 있습니다.',
        '"삭제" 버튼으로 콘텐츠를 삭제할 수 있습니다.',
        '판매 내역이 있는 콘텐츠도 강제 삭제 가능합니다 (재확인 필요).'
      ]
    },
    {
      title: '후기 관리',
      items: [
        '"후기 관리" 탭에서 모든 후기를 확인하고 관리합니다.',
        '부적절한 후기를 삭제할 수 있습니다.',
        '"모든 후기 삭제" 버튼으로 전체 후기를 초기화할 수 있습니다.'
      ]
    },
    {
      title: '등급 정책',
      items: [
        '"등급 정책" 탭에서 구매자/판매자 등급 정책을 관리합니다.',
        '등급별 할인율과 커미션율을 설정할 수 있습니다.'
      ]
    },
    {
      title: '회원 관리',
      items: [
        '"회원 관리" 탭에서 모든 사용자를 확인하고 관리합니다.',
        '사용자 권한(구매자, 판매자, 관리자)을 변경할 수 있습니다.'
      ]
    },
    {
      title: '제휴할인 신청',
      items: [
        '"제휴할인 신청" 탭에서 제휴할인 신청을 승인/거부합니다.',
        '맑은소프트 제휴할인만 지원합니다.'
      ]
    },
    {
      title: '판매 내역',
      items: [
        '"판매 내역" 탭에서 전체 판매 내역을 확인합니다.',
        '판매자별, 구매자별, 콘텐츠별 판매 내역을 확인할 수 있습니다.'
      ]
    }
  ];

  return (
    <>
      {/* 플로팅 버튼 */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000
        }}
      >
        <IconButton
          onClick={() => setOpen(true)}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            width: 56,
            height: 56,
            boxShadow: 3,
            '&:hover': {
              bgcolor: 'primary.dark',
              transform: 'scale(1.1)'
            },
            transition: 'all 0.3s'
          }}
        >
          <HelpIcon sx={{ fontSize: 28 }} />
        </IconButton>
      </Box>

      {/* 가이드 드로어 - 오버레이 없이 고정, 메인 화면과 함께 표시 */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        variant="temporary"
        PaperProps={{
          sx: {
            width: { xs: '90vw', sm: 380, md: 420 },
            maxWidth: 420,
            position: 'fixed',
            height: '100vh',
            top: 0,
            right: 0,
            zIndex: 1200,
            boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
            borderLeft: '1px solid rgba(0,0,0,0.12)'
          }
        }}
        ModalProps={{
          BackdropProps: {
            sx: {
              backgroundColor: 'rgba(0,0,0,0.1)', // 매우 투명한 오버레이
              pointerEvents: 'none' // 클릭 이벤트 무시하여 메인 화면 클릭 가능
            }
          }
        }}
        sx={{
          '& .MuiDrawer-root': {
            pointerEvents: 'none'
          },
          '& .MuiDrawer-paper': {
            pointerEvents: 'auto'
          }
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* 헤더 */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'primary.main',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              사용자 가이드
            </Typography>
            <IconButton
              onClick={() => setOpen(false)}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* 계정 정보 */}
          <Paper sx={{ m: 2, p: 2, bgcolor: 'info.light' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              테스트 계정 정보
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box>
                <Chip label="구매자" size="small" sx={{ mr: 1 }} />
                <Typography variant="body2" component="span">
                  ID: <strong>{accountInfo.buyer.id}</strong> / PW: <strong>{accountInfo.buyer.password}</strong>
                </Typography>
              </Box>
              <Box>
                <Chip label="판매자" size="small" sx={{ mr: 1 }} />
                <Typography variant="body2" component="span">
                  ID: <strong>{accountInfo.seller.id}</strong> / PW: <strong>{accountInfo.seller.password}</strong>
                </Typography>
              </Box>
              <Box>
                <Chip label="관리자" size="small" sx={{ mr: 1 }} />
                <Typography variant="body2" component="span">
                  {accountInfo.admin.id}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* 탭 */}
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="구매자 가이드" />
            <Tab label="판매자 가이드" />
            <Tab label="관리자 가이드" />
          </Tabs>

          {/* 가이드 내용 */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {tabValue === 0 && (
              <Box>
                {buyerGuide.map((section, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                        {section.title}
                      </Typography>
                      <List dense>
                        {section.items.map((item, itemIndex) => (
                          <ListItem key={itemIndex} sx={{ py: 0.5 }}>
                            <ListItemText
                              primary={item}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            {tabValue === 1 && (
              <Box>
                {sellerGuide.map((section, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                        {section.title}
                      </Typography>
                      <List dense>
                        {section.items.map((item, itemIndex) => (
                          <ListItem key={itemIndex} sx={{ py: 0.5 }}>
                            <ListItemText
                              primary={item}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            {tabValue === 2 && (
              <Box>
                {adminGuide.map((section, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                        {section.title}
                      </Typography>
                      <List dense>
                        {section.items.map((item, itemIndex) => (
                          <ListItem key={itemIndex} sx={{ py: 0.5 }}>
                            <ListItemText
                              primary={item}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default UserGuide;

