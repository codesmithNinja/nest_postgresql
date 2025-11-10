import { Language } from './language.entity';

export interface MinimalLanguage {
  publicId: string;
  name: string;
}

export interface Slider {
  id: string;
  publicId: string;
  uniqueCode: number;
  sliderImage: string;
  title: string;
  description: string;
  buttonTitle: string;
  buttonLink: string;
  languageId: string | Language | MinimalLanguage;
  language?: Language;
  customColor: boolean;
  titleColor: string;
  descriptionColor: string;
  buttonTitleColor: string;
  buttonLinkColor: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSliderDto {
  uniqueCode: number;
  sliderImage: string;
  title: string;
  description: string;
  buttonTitle: string;
  buttonLink: string;
  languageId: string;
  customColor?: boolean;
  titleColor?: string;
  descriptionColor?: string;
  buttonTitleColor?: string;
  buttonLinkColor?: string;
  status?: boolean;
}

export interface UpdateSliderDto {
  sliderImage?: string;
  title?: string;
  description?: string;
  buttonTitle?: string;
  buttonLink?: string;
  customColor?: boolean;
  titleColor?: string;
  descriptionColor?: string;
  buttonTitleColor?: string;
  buttonLinkColor?: string;
  status?: boolean;
}

export interface SliderWithLanguage extends Slider {
  language: Language;
}
