import tw from 'twin.macro';
import Reaptcha from 'reaptcha';
import login from '@/api/auth/login';
import { object, string } from 'yup';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { Formik, FormikHelpers } from 'formik';
import { Alert } from '@/components/elements/alert';
import Field from '@/components/elements/Field';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/elements/button/index';
import { Link, RouteComponentProps } from 'react-router-dom';
import LoginFormContainer from '@/components/auth/LoginFormContainer';

interface Values {
    username: string;
    password: string;
}

const LoginContainer = ({ history }: RouteComponentProps) => {
    const ref = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');
    const name = useStoreState((state) => state.settings.data?.name);
    const email = useStoreState((state) => state.settings.data?.registration.email);
    const discord = useStoreState((state) => state.settings.data?.registration.discord);

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { enabled: recaptchaEnabled, siteKey } = useStoreState((state) => state.settings.data!.recaptcha);

    useEffect(() => {
        clearFlashes();
    }, []);

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();

        // If there is no token in the state yet, request the token and then abort this submit request
        // since it will be re-submitted when the recaptcha data is returned by the component.
        if (recaptchaEnabled && !token) {
            ref.current!.execute().catch((error) => {
                console.error(error);

                setSubmitting(false);
                clearAndAddHttpError({ error });
            });

            return;
        }

        login({ ...values, recaptchaData: token })
            .then((response) => {
                if (response.complete) {
                    // @ts-expect-error this is valid
                    window.location = response.intended || '/';
                    return;
                }

                history.replace('/auth/login/checkpoint', { token: response.confirmationToken });
            })
            .catch((error) => {
                console.error(error);

                setToken('');
                if (ref.current) ref.current.reset();

                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
    };

    return (
        <Formik
            onSubmit={onSubmit}
            initialValues={{ username: '', password: '' }}
            validationSchema={object().shape({
                username: string().required('A username or email must be provided.'),
                password: string().required('Please enter your account password.'),
            })}
        >
            {({ isSubmitting, setSubmitting, submitForm }) => (
                <LoginFormContainer title={'登入至 ' + name} css={tw`w-full flex`}>
                    <Alert
                        type="info"
                        className="my-4 w-full"
                    >
                        目前不開放電子郵件註冊，請使用Discord登入.
                    </Alert>
                    <Field light type={'text'} label={'用戶名 或 密碼'} name={'username'} disabled={isSubmitting} />
                    <div css={tw`mt-6`}>
                        <Field light type={'password'} label={'密碼'} name={'password'} disabled={isSubmitting} />
                    </div>
                    <div css={tw`mt-6`}>
                        <Button type={'submit'} size={Button.Sizes.Large} css={tw`w-full`} disabled={isSubmitting}>
                            登入
                        </Button>
                    </div>
                    {recaptchaEnabled && (
                        <Reaptcha
                            ref={ref}
                            size={'invisible'}
                            sitekey={siteKey || '_invalid_key'}
                            onVerify={(response) => {
                                setToken(response);
                                submitForm();
                            }}
                            onExpire={() => {
                                setSubmitting(false);
                                setToken('');
                            }}
                        />
                    )}
                    <div css={tw`mt-6 text-center`}>
                        <Link
                            to={'/auth/password'}
                        >
                            <Button style={{ backgroundColor: '#808080' }} size={Button.Sizes.Large} disabled={isSubmitting}>
                                忘記密碼?
                            </Button>
                        </Link>
                    </div>
                    {(email || discord) && (
                        <div css={tw`mt-6 text-center`}>
                            {email && (
                                <Link
                                    to={'/auth/register'}
                                    css={tw`text-xs text-neutral-500 tracking-wide no-underline uppercase hover:text-neutral-600`}
                                >
                                    使用Email註冊
                                </Link>
                            )}
                            {discord && (
                                <Link
                                    to={'/auth/discord'}
                                >
                                    <Button style={{ backgroundColor: '#5865F2' }} size={Button.Sizes.Large} disabled={isSubmitting}>
                                        使用 Discord 登入
                                    </Button>
                                </Link>
                            )}
                        </div>
                    )}
                </LoginFormContainer>
            )}
        </Formik>
    );
};

export default LoginContainer;
