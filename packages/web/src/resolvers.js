import { DIRECTION_ALL } from 'hammerjs';

export const singlePanResolverSettings = {
  event: 'pan',
  direction: DIRECTION_ALL,
  threshold: 0,
  pointers: 1,
};

export const multiPanResolverSettings = {
  event: 'multipan',
  direction: DIRECTION_ALL,
  threshold: 0,
  pointers: 2,
};

export const pressResolverSettings = {
  time: 500,
};
