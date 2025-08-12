import { SxProps, Theme } from '@mui/material/styles';

export const containerStylesClient: SxProps<Theme> = (theme) => ({
  minHeight: '100dvh',
  display: 'grid',
  placeItems: 'center',
  padding: theme.spacing(2),
  background: `linear-gradient(135deg, ${theme.palette.primary.light}22 0%, ${
    theme.palette.secondary?.light || '#9c27b0'
  }22 100%)`,
});

export const cardStylesClient: SxProps<Theme> = (theme) => ({
  width: '100%',
  maxWidth: 480,
  borderRadius: 6,
  boxShadow: theme.shadows[8],
});

export const titleStylesClient: SxProps<Theme> = (theme) => ({
  '& .MuiCardHeader-title': {
    fontWeight: 800,
    fontSize: 18,
  },
  '& .MuiCardHeader-subheader': {
    opacity: 0.8,
  },
});

export const textFieldStylesClient: SxProps<Theme> = (theme) => ({
  my: 1.25,
  '& .MuiOutlinedInput-root': {
    borderRadius: 999,
  },
});

export const buttonStylesClient: SxProps<Theme> = (theme) => ({
  mt: 2.5,
  py: 1.25,
  borderRadius: 999,
  fontWeight: 700,
  textTransform: 'none',
  fontSize: 16,
});

export const alertStylesClient: SxProps<Theme> = () => ({
  mt: 2,
  borderRadius: 3,
});

export const tabListStylesClient: SxProps<Theme> = () => ({
  mb: 1,
});
