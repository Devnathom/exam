'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Quiz as QuizIcon,
  QrCodeScanner as ScannerIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/services/api';
import { wsService } from '@/services/websocket';

const DRAWER_WIDTH = 260;

const menuItems = [
  { label: 'แดชบอร์ด', icon: <DashboardIcon />, path: '/admin/dashboard' },
  { label: 'นักเรียน', icon: <PeopleIcon />, path: '/admin/students' },
  { label: 'ข้อสอบ', icon: <QuizIcon />, path: '/admin/exams' },
  { label: 'สแกนเนอร์', icon: <ScannerIcon />, path: '/scanner' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, setUser, setLoading, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    authApi
      .me()
      .then(({ data }) => {
        setUser(data);
        if (data.schoolId) {
          wsService.connect(data.schoolId);
        }
      })
      .catch(() => {
        logout();
        router.push('/auth/login');
      })
      .finally(() => setLoading(false));

    return () => {
      wsService.disconnect();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    wsService.disconnect();
    logout();
    router.push('/auth/login');
  };

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'ผู้ดูแลระบบ',
    SCHOOL_ADMIN: 'ผู้ดูแลโรงเรียน',
    TEACHER: 'ครู',
    SCANNER_OPERATOR: 'เจ้าหน้าที่สแกน',
  };

  const drawerContent = (
    <Box>
      <Box sx={{ p: 2.5, textAlign: 'center', bgcolor: 'primary.main' }}>
        <SchoolIcon sx={{ fontSize: 40, color: 'white', mb: 0.5 }} />
        <Typography variant="subtitle1" color="white" fontWeight={700}>
          ระบบจัดการสอบ OMR
        </Typography>
      </Box>
      <List sx={{ px: 1, pt: 1 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.path}
            onClick={() => {
              router.push(item.path);
              setMobileOpen(false);
            }}
            selected={pathname === item.path}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                '& .MuiListItemIcon-root': { color: 'white' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={roleLabels[user.role] || user.role}
                size="small"
                color="primary"
                variant="outlined"
              />
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
                  {user.firstName[0]}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
              >
                <MenuItem disabled>
                  <Typography variant="body2">
                    {user.firstName} {user.lastName}
                  </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                  ออกจากระบบ
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, borderRight: 'none', boxShadow: '2px 0 8px rgba(0,0,0,0.06)' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
