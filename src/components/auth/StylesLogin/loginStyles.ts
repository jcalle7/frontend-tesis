import { SxProps, Theme } from '@mui/material/styles';

export const containerStyles: SxProps<Theme> = (theme) => ({
  minHeight: '100dvh',                        // altura real en móviles modernos
  display: 'grid',
  placeItems: 'center',
  background: `linear-gradient(135deg, ${theme.palette.primary.light}22 0%, ${theme.palette.secondary?.light || '#9c27b0'}22 100%)`,
  padding: theme.spacing(2),
  paddingBottom: 'max(16px, env(safe-area-inset-bottom))', // notch / iPhone
  paddingTop: 'max(16px, env(safe-area-inset-top))',
});

export const cardStyles: SxProps<Theme> = (theme) => ({
  width: '100%',
  maxWidth: 440,
  borderRadius: 10,
  overflow: 'hidden',
  backdropFilter: 'blur(6px)',
  boxShadow: '0 10px 30px rgba(0,0,0,.08)',
  [theme.breakpoints.down('sm')]: {
    maxWidth: 360,
    borderRadius: 14,
  },
});

export const titleStyles: SxProps<Theme> = (theme) => ({
  fontWeight: 800,
  letterSpacing: .2,
  fontSize: { xs: 22, sm: 24 },               // tipografía fluida
  textAlign: { xs: 'center', sm: 'left' },
});

export const subtitleStyles: SxProps<Theme> = (theme) => ({
  mt: .5,
  color: theme.palette.text.secondary,
  fontSize: { xs: 13, sm: 14 },
  textAlign: { xs: 'center', sm: 'left' },
});

export const textFieldStyles: SxProps<Theme> = (theme) => ({
  mb: 2,
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    // evita zoom en iOS: MUI ya usa 16px, pero reforzamos
    fontSize: 16,
  },
  '& .MuiInputLabel-root': { fontSize: 14 },
});

export const footerRowStyles: SxProps<Theme> = (theme) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mb: 2,
  gap: 1,
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: .5,
  },
});

export const buttonStyles: SxProps<Theme> = (theme) => ({
  py: 1.25,
  borderRadius: 12,
  textTransform: 'none',
  fontWeight: 700,
  fontSize: 16,                                // hit-target cómodo en móvil
});
