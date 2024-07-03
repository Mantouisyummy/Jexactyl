import React from 'react';
import tw from 'twin.macro';
import { object, string } from 'yup';
import styled from 'styled-components';
import useFlash from '@/plugins/useFlash';
import { useRouteMatch } from 'react-router';
import { httpErrorToHuman } from '@/api/http';
import { createMessage } from '@/api/account/tickets';
import { Textarea } from '@/components/elements/Input';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import { Button } from '@/components/elements/button/index';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Dialog, DialogProps } from '@/components/elements/dialog';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';

interface Values {
    description: string;
}

const CustomTextarea = styled(Textarea)`
    ${tw`h-32`}
`;

export default ({ open, onClose }: DialogProps) => {
    const match = useRouteMatch<{ id: string }>();
    const id = parseInt(match.params.id);

    const { addError, clearFlashes, addFlash } = useFlash();

    const submit = (values: Values, { setSubmitting, resetForm }: FormikHelpers<Values>) => {
        clearFlashes('tickets');

        createMessage(id, values.description)
            .then(() => {
                resetForm();
                setSubmitting(false);

                addFlash({
                    key: 'tickets',
                    type: 'success',
                    message: '您的訊息已傳送成功!',
                });
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
            title={'新增一則訊息'}
            description={'此訊息將讓您和面板上的管理員都可看見.'}
        >
            <Formik
                onSubmit={submit}
                initialValues={{ description: '' }}
                validationSchema={object().shape({
                    description: string().required().min(4),
                })}
            >
                {({ isSubmitting }) => (
                    <Form className={'mt-6'}>
                        <SpinnerOverlay visible={isSubmitting} />
                        <FormikFieldWrapper
                            label={'訊息內容'}
                            name={'description'}
                            description={
                                '請提供額外的資訊、圖片和其他內容，以便我們更快地解決您的問題.'
                            }
                        >
                            <Field name={'description'} as={CustomTextarea} />
                        </FormikFieldWrapper>
                        <div className={'flex justify-end mt-6'}>
                            <Button type={'submit'}>傳送</Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </Dialog>
    );
};
