import type { Address } from "../types";
import instance from "./axiosInstance";

export const fetchAddresses = (): Promise<Address[]> =>
    instance.get("/addresses").then(r => r.data ?? []);

export const createAddress = (address: Partial<Address>): Promise<Address> =>
    instance.post("/addresses", address).then(r => r.data);

export const updateAddress = (id: number, address: Partial<Address>): Promise<Address> =>
    instance.put(`/addresses/${id}`, address).then(r => r.data);

export const deleteAddress = (id: number) =>
    instance.delete(`/addresses/${id}`);