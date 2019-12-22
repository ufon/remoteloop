export const singlePanResolverSettings = {
  event: "pan",
  direction: Hammer.DIRECTION_ALL,
  threshold: 0,
  pointers: 1
};

export const multiPanResolverSettings = {
  event: "multipan",
  direction: Hammer.DIRECTION_ALL,
  threshold: 0,
  pointers: 2
};

export const pressResolverSettings = {
  time: 500
};
