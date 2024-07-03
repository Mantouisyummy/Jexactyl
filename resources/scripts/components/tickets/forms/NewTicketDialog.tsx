import React from 'react';
import tw from 'twin.macro';
import { object, string } from 'yup';
import styled from 'styled-components';
import useFlash from '@/plugins/useFlash';
import { httpErrorToHuman } from '@/api/http';
import { createTicket } from '@/api/account/tickets';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import { Button } from '@/components/elements/button/index';
import Input, { Textarea } from '@/components/elements/Input';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Dialog, DialogProps } from '@/components/elements/dialog';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';

interface Values {
    title: string;
    description: string;
}

const CustomTextarea = styled(Textarea)`
    ${tw`h-32`}
`;

export default ({ open, onClose }: DialogProps) => {
    const { addError, clearFlashes } = useFlash();

    const submit = (values: Values, { setSubmitting, resetForm }: FormikHelpers<Values>) => {
        clearFlashes('tickets');

        createTicket(values.title, values.description)
            .then((data) => {
                resetForm();
                setSubmitting(false);

                // @ts-expect-error this is valid
                window.location = `/tickets/${data.id}`;
            })
            .catch((error) => {
                setSubmitting(false);

                addError({ key: 'tickets', message: httpErrorToHuman(error) });
            });
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={'建立一個新客服單'}
            description={
                '此客服單將註冊在您的帳戶下，並供面板上的所有管理員存取.'
            }
        >
            <Formik
                onSubmit={submit}
                initialValues={{ title: '', description: '' }}
                validationSchema={object().shape({
                    allowedIps: string(),
                    description: string().required().min(4),
                })}
            >
                {({ isSubmitting }) => (
                    <Form className={'mt-6'}>
                        <SpinnerOverlay visible={isSubmitting} />
                        <FormikFieldWrapper
                            label={'Title'}
                            name={'title'}
                            description={'客服單的標題'}
                            className={'mb-6'}
                        >
                            <Field name={'title'} as={Input} />
                        </FormikFieldWrapper>
                        <FormikFieldWrapper
                            label={'Description'}
                            name={'description'}
                            description={
                                '請提供額外的資訊、圖片和其他內容，以便我們更快地解決您的問題.'
                            }
                        >
                            <Field name={'description'} as={CustomTextarea} />
                        </FormikFieldWrapper>
                        <div className={'flex justify-end mt-6'}>
                            <Button type={'submit'}>建立</Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </Dialog>
    );
};
