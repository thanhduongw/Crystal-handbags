package iuh.fit.se.backend.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableRabbit
public class RabbitMQConfig {

    @Value("${app.rabbitmq.exchange}")
    private String mainExchangeName;

    @Value("${app.rabbitmq.dlx}")
    private String deadLetterExchangeName;

    @Value("${app.rabbitmq.queue.order-created}")
    private String orderCreatedQueueName;

    @Value("${app.rabbitmq.queue.order-created-dead}")
    private String orderCreatedDeadQueueName;

    @Value("${app.rabbitmq.queue.payment-success}")
    private String paymentSuccessQueueName;

    @Value("${app.rabbitmq.queue.payment-failed}")
    private String paymentFailedQueueName;

    @Value("${app.rabbitmq.queue.order-cancelled}")
    private String orderCancelledQueueName;

    @Value("${app.rabbitmq.queue.email-notification}")
    private String emailNotificationQueueName;

    @Bean
    public TopicExchange mainExchange() {
        return new TopicExchange(mainExchangeName, true, false);
    }

    @Bean
    public DirectExchange deadLetterExchange() {
        return new DirectExchange(deadLetterExchangeName, true, false);
    }

    @Bean
    public Queue orderCreatedQueue() {
        return QueueBuilder.durable(orderCreatedQueueName)
                .withArgument("x-dead-letter-exchange", deadLetterExchangeName)
                .withArgument("x-dead-letter-routing-key", orderCreatedDeadQueueName)
                .build();
    }

    @Bean
    public Queue orderCreatedDeadQueue() {
        return QueueBuilder.durable(orderCreatedDeadQueueName).build();
    }

    @Bean
    public Queue paymentSuccessQueue() {
        return QueueBuilder.durable(paymentSuccessQueueName).build();
    }

    @Bean
    public Queue paymentFailedQueue() {
        return QueueBuilder.durable(paymentFailedQueueName).build();
    }

    @Bean
    public Queue orderCancelledQueue() {
        return QueueBuilder.durable(orderCancelledQueueName).build();
    }

    @Bean
    public Queue emailNotificationQueue() {
        return QueueBuilder.durable(emailNotificationQueueName).build();
    }

    @Bean
    public Binding orderCreatedBinding(TopicExchange mainExchange) {
        return BindingBuilder.bind(orderCreatedQueue()).to(mainExchange).with(orderCreatedQueueName);
    }

    @Bean
    public Binding orderCreatedDeadBinding(DirectExchange deadLetterExchange) {
        return BindingBuilder.bind(orderCreatedDeadQueue()).to(deadLetterExchange).with(orderCreatedDeadQueueName);
    }

    @Bean
    public Binding paymentSuccessBinding(TopicExchange mainExchange) {
        return BindingBuilder.bind(paymentSuccessQueue()).to(mainExchange).with(paymentSuccessQueueName);
    }

    @Bean
    public Binding paymentFailedBinding(TopicExchange mainExchange) {
        return BindingBuilder.bind(paymentFailedQueue()).to(mainExchange).with(paymentFailedQueueName);
    }

    @Bean
    public Binding orderCancelledBinding(TopicExchange mainExchange) {
        return BindingBuilder.bind(orderCancelledQueue()).to(mainExchange).with(orderCancelledQueueName);
    }

    @Bean
    public Binding emailNotificationBinding(TopicExchange mainExchange) {
        return BindingBuilder.bind(emailNotificationQueue()).to(mainExchange).with("email.#");
    }

    @Bean
    public Jackson2JsonMessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
