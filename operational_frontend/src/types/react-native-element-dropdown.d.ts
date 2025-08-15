declare module 'react-native-element-dropdown' {
  import { ComponentType } from 'react';
  import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

  export interface DropdownProps<T> {
    data: T[];
    labelField: string;
    valueField: string;
    onChange: (item: T) => void;
    style?: ViewStyle | ViewStyle[];
    selectedTextStyle?: TextStyle | TextStyle[];
    placeholder?: string;
    placeholderStyle?: TextStyle | TextStyle[];
    selectedTextProps?: any;
    containerStyle?: ViewStyle | ViewStyle[];
    itemContainerStyle?: ViewStyle | ViewStyle[];
    itemTextStyle?: TextStyle | TextStyle[];
    activeColor?: string;
    maxHeight?: number;
    search?: boolean;
    searchPlaceholder?: string;
    searchQuery?: (keyword: string, labelValue: string) => boolean;
    value?: any;
    disable?: boolean;
    dropdownPosition?: 'auto' | 'top' | 'bottom';
    showsVerticalScrollIndicator?: boolean;
    keyboardAvoiding?: boolean;
    renderLeftIcon?: () => React.ReactNode;
    renderRightIcon?: () => React.ReactNode;
    renderItem?: (item: T, selected?: boolean) => React.ReactNode;
    renderInputSearch?: (onSearch: (search: string) => void) => React.ReactNode;
    flatListProps?: any;
    testID?: string;
  }

  export const Dropdown: <T>(props: DropdownProps<T>) => JSX.Element;

  export interface MultiSelectProps<T> {
    data: T[];
    labelField: string;
    valueField: string;
    onChange: (items: T[]) => void;
    selectedStyle?: ViewStyle | ViewStyle[];
    selectedTextStyle?: TextStyle | TextStyle[];
    itemContainerStyle?: ViewStyle | ViewStyle[];
    itemTextStyle?: TextStyle | TextStyle[];
    style?: ViewStyle | ViewStyle[];
    placeholder?: string;
    placeholderStyle?: TextStyle | TextStyle[];
    selectedTextProps?: any;
    containerStyle?: ViewStyle | ViewStyle[];
    activeColor?: string;
    maxHeight?: number;
    search?: boolean;
    searchPlaceholder?: string;
    searchQuery?: (keyword: string, labelValue: string) => boolean;
    value?: any[];
    disable?: boolean;
    dropdownPosition?: 'auto' | 'top' | 'bottom';
    showsVerticalScrollIndicator?: boolean;
    keyboardAvoiding?: boolean;
    renderLeftIcon?: () => React.ReactNode;
    renderRightIcon?: () => React.ReactNode;
    renderItem?: (item: T, selected?: boolean) => React.ReactNode;
    renderSelectedItem?: (item: T, unSelect?: (item: T) => void) => React.ReactNode;
    renderInputSearch?: (onSearch: (search: string) => void) => React.ReactNode;
    flatListProps?: any;
    testID?: string;
  }

  export const MultiSelect: <T>(props: MultiSelectProps<T>) => JSX.Element;

  export interface SelectCountryProps {
    data: any[];
    value?: any;
    valueField?: string;
    labelField?: string;
    imageField?: string;
    selectedTextStyle?: TextStyle | TextStyle[];
    placeholder?: string;
    placeholderStyle?: TextStyle | TextStyle[];
    containerStyle?: ViewStyle | ViewStyle[];
    itemContainerStyle?: ViewStyle | ViewStyle[];
    itemTextStyle?: TextStyle | TextStyle[];
    itemFlagStyle?: ImageStyle | ImageStyle[];
    itemFlagSize?: number;
    itemFlagType?: 'circle' | 'square';
    itemFlagBorderRadius?: number;
    itemFlagBorderColor?: string;
    itemFlagBorderWidth?: number;
    itemFlagMarginRight?: number;
    itemTextNumberOfLines?: number;
    activeColor?: string;
    maxHeight?: number;
    search?: boolean;
    searchPlaceholder?: string;
    searchQuery?: (keyword: string, labelValue: string) => boolean;
    disable?: boolean;
    dropdownPosition?: 'auto' | 'top' | 'bottom';
    showsVerticalScrollIndicator?: boolean;
    keyboardAvoiding?: boolean;
    renderLeftIcon?: () => React.ReactNode;
    renderRightIcon?: () => React.ReactNode;
    renderItem?: (item: any, selected?: boolean) => React.ReactNode;
    renderInputSearch?: (onSearch: (search: string) => void) => React.ReactNode;
    flatListProps?: any;
    testID?: string;
    onChange: (item: any) => void;
  }

  export const SelectCountry: (props: SelectCountryProps) => JSX.Element;

  // Export types for refs
  export interface IDropdownRef {
    open: () => void;
    close: () => void;
  }

  export interface IMultiSelectRef {
    open: () => void;
    close: () => void;
  }

  export interface ISelectCountryRef {
    open: () => void;
    close: () => void;
  }
}
