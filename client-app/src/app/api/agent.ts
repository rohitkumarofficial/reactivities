import { User, UserCreateOrLogin } from './../models/user';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { Activity, ActivityFormValues } from './../models/activity';
import { history } from './../../index';
import { store } from './../stores/store';
import { Profile } from '../models/profile';

const delay = (delay: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, delay);
    })
}

axios.defaults.baseURL = 'http://localhost:5000/api';

axios.interceptors.request.use(config => {
    const token = store.commonStore.token;
    if(token) {
        config.headers.Authorization = 'Bearer ' + token;
    }
    return config;
})

axios.interceptors.response.use(
    async response => {
        await delay(1000);
        return response;
    },
    (error: AxiosError) => {
        const { data, status } = error.response!;
        switch (status) {
            case 400:
                if (data.errors) {
                    const modalStateErrors = [];
                    for (const key in data.errors) {
                        if (data.errors[key]) {
                            modalStateErrors.push(data.errors[key])
                        }
                    }
                    throw modalStateErrors.flat();
                } else {
                    toast.error(data);
                }
                break;
            case 401:
                toast.error('UnAuthorized');
                break;
            case 404:
                history.push('/not-found');
                toast.error('Not Found');
                break;
            case 500:
                store.commonStore.setServerError(data);
                history.push('server-error');
                break;
        }
        return Promise.reject(error);
    }
)

const responseBody = <T> (response: AxiosResponse<T>) => response.data;

const request = {
    get: <T> (url: string) => axios.get<T>(url).then(responseBody),
    post: <T> (url: string, body: {}) => axios.post<T>(url, body).then(responseBody),
    put: <T> (url: string, body: {}) => axios.put<T>(url, body).then(responseBody),
    delete: <T> (url: string) => axios.delete<T>(url).then(responseBody)
}

const Activities = {
    list: () => request.get<Activity[]>('/activities'),
    details: (id: string) => request.get<Activity>(`/activities/${id}`),
    create: (activity: ActivityFormValues) => request.post<void>('activities', activity),
    update: (activity: ActivityFormValues) => request.put<void>(`/activities/${activity.id}`, activity),
    delete: (id: string) => request.delete<void>(`/activities/${id}`),
    attend: (id: string) => request.post<void>(`/activities/${id}/attend`,{})
}

const Account = {
    current: () => request.get<User>('/account'),
    login: (user: Partial<UserCreateOrLogin>) => request.post<User>('/account/login', user),
    register: (user: UserCreateOrLogin) => request.post<User>('/account/register', user)
}

const Profiles = {
    get: (username: string) => request.get<Profile>(`/profiles/${username}`)
}
const agent = {
    Activities,
    Account,
    Profiles
}

export default agent;